#!/usr/bin/env node
/**
 * Build-time script — two jobs:
 *
 * 1. NORMALISE — strips full Vimeo URLs to just numeric IDs in both JSON files
 * 2. THUMBNAILS — for any entry with a vimeo_id but no thumbnail_url, fetches
 *    it from Vimeo oEmbed and writes it in (so the site never needs runtime fetches)
 * 3. SYNC — adds any Selected Work project missing from Archive
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

const PROJECTS_FILE = path.join(__dirname, '../data/projects.json');
const ARCHIVE_FILE  = path.join(__dirname, '../data/archive.json');

function normaliseVimeoId(raw) {
  if (!raw) return null;
  const match = String(raw).match(/(\d{6,})/);
  return match ? match[1] : String(raw);
}

function fetchVimeoThumb(vimeoId) {
  return new Promise((resolve) => {
    const url = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}&width=640`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.thumbnail_url || null);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
  const archiveData  = JSON.parse(fs.readFileSync(ARCHIVE_FILE, 'utf8'));

  // ── 1. Normalise vimeo_ids ──────────────────────────────────────────────
  for (const p of projectsData.projects) {
    if (p.vimeo_id) p.vimeo_id = normaliseVimeoId(p.vimeo_id);
  }
  for (const p of archiveData.projects) {
    if (p.vimeo_id) p.vimeo_id = normaliseVimeoId(p.vimeo_id);
  }

  // ── 2. Fetch missing thumbnails ─────────────────────────────────────────
  // Selected Work: store as thumbnail_url (keeps CMS-uploaded thumbnail as fallback)
  for (const p of projectsData.projects) {
    if (p.vimeo_id && !p.thumbnail_url) {
      const url = await fetchVimeoThumb(p.vimeo_id);
      if (url) {
        p.thumbnail_url = url;
        console.log(`  ✓ Thumbnail fetched for: ${p.title}`);
      }
    }
  }
  // Archive: same
  for (const p of archiveData.projects) {
    if (p.vimeo_id && !p.thumbnail_url) {
      const url = await fetchVimeoThumb(p.vimeo_id);
      if (url) {
        p.thumbnail_url = url;
        console.log(`  ✓ Thumbnail fetched for: ${p.title}`);
      }
    }
  }

  // ── 3. Sync Selected Work → Archive ────────────────────────────────────
  let added = 0;
  for (const project of [...projectsData.projects].reverse()) {
    const vid   = project.vimeo_id;
    const title = project.title?.trim().toLowerCase();

    const alreadyInArchive = archiveData.projects.some(p => {
      return (vid && p.vimeo_id && vid === p.vimeo_id) ||
             (title && p.title?.trim().toLowerCase() === title);
    });

    if (!alreadyInArchive) {
      archiveData.projects.unshift({
        title:       project.title,
        category:    project.category,
        year:        project.year,
        ...(vid                 && { vimeo_id:     vid }),
        ...(project.youtube_id  && { youtube_id:   project.youtube_id }),
        ...(project.thumbnail_url && { thumbnail_url: project.thumbnail_url }),
        credits:     project.credits || {}
      });
      added++;
      console.log(`  + Added to archive: ${project.title}`);
    } else if (vid) {
      // Update thumbnail_url in archive if it now has one and archive doesn't
      const existing = archiveData.projects.find(p => p.vimeo_id === vid);
      if (existing && !existing.thumbnail_url && project.thumbnail_url) {
        existing.thumbnail_url = project.thumbnail_url;
      }
    }
  }

  // ── Write files ─────────────────────────────────────────────────────────
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projectsData, null, 2));
  fs.writeFileSync(ARCHIVE_FILE,  JSON.stringify(archiveData,  null, 2));

  console.log(`sync-to-archive: done. Added ${added} project(s) to archive.`);
}

main().catch(e => { console.error(e); process.exit(1); });
