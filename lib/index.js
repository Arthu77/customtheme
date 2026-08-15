// Host half: this plugin is browser-only, so the host side is a no-op that
// merely keeps the composition row active. dsh-client-modules serves the
// client bundle (/plugins/<id>/client.js) only for rows whose host fiber has
// activated, so this module must exist and activate successfully.
export function apply() {}
