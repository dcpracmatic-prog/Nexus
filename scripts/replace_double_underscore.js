#!/usr/bin/env node
// Usage: node scripts/replace_double_underscore.js [--apply]
// Default: dry-run. Use --apply to perform moves/edits.

const fs = require('fs').promises;
const path = require('path');

const root = process.cwd();
const apply = process.argv.includes('--apply');
const extsToEdit = new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.html','.md','.css','.scss','.less']);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (full.includes('node_modules')) continue;
      files.push(...await walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function rel(p) {
  return path.relative(root, p).split(path.sep).join('/');
}

function newPathFromRel(relPath) {
  // Replace every double underscore (or more) with slash
  return relPath.replace(/__+/g, '/');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function renameFiles(files) {
  const moves = [];
  for (const f of files) {
    const r = rel(f);
    if (r.includes('__')) {
      const newRel = newPathFromRel(r);
      const target = path.join(root, ...newRel.split('/'));
      moves.push({ from: f, to: target, fromRel: r, toRel: newRel });
    }
  }
  for (const m of moves) {
    console.log(`[MOVE] ${m.fromRel} -> ${m.toRel}`);
  }
  if (!apply) {
    console.log('-- dry-run (no files moved). Rerun with --apply to apply moves.');
    return moves;
  }
  for (const m of moves) {
    await ensureDir(path.dirname(m.to));
    // If target exists, warn and skip
    try {
      await fs.access(m.to);
      console.warn(`[SKIP] target exists: ${m.toRel}`);
      continue;
    } catch {}
    await fs.rename(m.from, m.to);
  }
  return moves;
}

function replaceInImportLikeStrings(content) {
  // Replace only inside quoted strings that contain '__'
  return content.replace(/(['"`])([^'"`]*__[^'"`]*)\1/g, (m, q, inside) => {
    const rep = inside.replace(/__+/g, '/');
    return q + rep + q;
  });
}

async function updateReferences(allFiles) {
  const edited = [];
  for (const f of allFiles) {
    const ext = path.extname(f).toLowerCase();
    if (!extsToEdit.has(ext)) continue;
    let txt;
    try {
      txt = await fs.readFile(f, 'utf8');
    } catch {
      continue;
    }
    const newTxt = replaceInImportLikeStrings(txt);
    if (newTxt !== txt) {
      console.log(`[EDIT] ${rel(f)}`);
      edited.push({ file: f, before: txt, after: newTxt });
      if (apply) {
        await fs.writeFile(f, newTxt, 'utf8');
      }
    }
  }
  if (!apply) console.log('-- dry-run (no files edited). Rerun with --apply to apply edits.');
  return edited;
}

(async () => {
  console.log(`Root: ${root}`);
  console.log(apply ? 'Mode: APPLY (changes will be made)' : 'Mode: DRY-RUN (no changes)');
  const allFiles = await walk(root);
  const fileMoves = await renameFiles(allFiles);
  // Recompute file list if applied, otherwise use original list
  const currentFiles = apply ? await walk(root) : allFiles;
  const edits = await updateReferences(currentFiles);

  console.log('--- Summary ---');
  console.log(`Planned/Executed moves: ${fileMoves.length}`);
  console.log(`Planned/Executed edits: ${edits.length}`);
  if (!apply) {
    console.log('Run with --apply to perform the moves and edits.');
  } else {
    console.log('Done. Please run tests/build/lint and commit the changes.');
  }
})();
