// The menu story's still: shown on the stage until the scene has drawn, and in place of the scene when it
// cannot run. There are two framings, as the scene has two: the open spread for wide screens, and one page
// for upright ones (menu-story.js frames a stage narrower than 0.85 of its height that way). The runtime
// only names both files here; agr.css picks one with an aspect-ratio query on the same 0.85, so a phone
// downloads only the upright still and a computer only the wide one, and turning the phone swaps it.

/**
 * @param {HTMLElement} stage the story's `.s3-stage`
 * @param {string} dir the story's asset folder, ending in a slash
 * @param {string} [query] a cache-busting query string, e.g. `?v=20261126`
 */
export function showStoryPoster(stage, dir, query = '') {
  stage.style.setProperty('--s3-poster', `url(${dir}poster.jpg${query})`)
  stage.style.setProperty('--s3-poster-tall', `url(${dir}poster-tall.jpg${query})`)
}

/** @param {HTMLElement} stage */
export function hideStoryPoster(stage) {
  stage.style.removeProperty('--s3-poster')
  stage.style.removeProperty('--s3-poster-tall')
}
