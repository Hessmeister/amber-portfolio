#!/usr/bin/env node
/**
 * Syncs Selected Work → Archive
 * Runs at build time. Any project in projects.json that isn't already
 * in archive.json (matched by Vimeo ID or title) gets added to the top.
 * Removing a project from Selected Work does NOT remove it from Archive.
 */

const fs = require('fs');
const path = require('path');

const PROJECTS_FILE = path.join(__dirname, '../data/projects.json');
const ARCHIVE_FILE  = path.join(__dirname, '../data/archive.json');

function normaliseVimeoId(raw) {
  if (!raw) return null;
  // Handle full URLs like https://vimeo.com/1170309766
  const match = String(raw).match(/(\d{6,})/);
  return match ? match[1] : String(raw);
}

const { projects }        = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
const archiveData         = JSON.parse(fs.readFileSync(ARCHIVE_FILE, 'utf8'));

let added = 0;

for (const project of [...projects].reverse()) {
  const vid   = normaliseVimeoId(project.vimeo_id);
  const title = project.title?.trim().toLowerCase();

  const alreadyInArchive = archiveData.projects.some(p => {
    const pVid   = normaliseVimeoId(p.vimeo_id);
    const pTitle = p.title?.trim().toLowerCase();
    return (vid && pVid && vid === pVid) || (title && pTitle && title === pTitle);
  });

  if (!alreadyInArchive) {
    archiveData.projects.unshift({
      title:        project.title,
      category:     project.category,
      year:         project.year,
      ...(vid                  && { vimeo_id:      vid }),
      ...(project.youtube_id   && { youtube_id:    project.youtube_id }),
      // thumbnail_url intentionally omitted — auto-fetched from Vimeo at runtime
      credits:      project.credits || {}
    });
    added++;
    console.log(`  + Added to archive: ${project.title}`);
  }
}

if (added > 0) {
  fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(archiveData, null, 2));
  console.log(`sync-to-archive: added ${added} project(s) from Selected Work.`);
} else {
  console.log('sync-to-archive: archive already up to date.');
}
