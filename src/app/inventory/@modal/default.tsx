// No modal active (direct navigation, refresh, or after closing) → render
// nothing. This is the fallback for the @modal slot when no intercepting
// route matches.
export default function ModalDefault() {
  return null;
}
