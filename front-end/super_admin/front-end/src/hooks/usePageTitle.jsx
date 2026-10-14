import { useEffect } from 'react';

/** Set document.title while a page is mounted. */
export default function usePageTitle(title) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
