// components/GithubMarkdown.jsx
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

export function GithubMarkdown({ url }) {
  const [content, setContent] = useState('Loading...');

  useEffect(() => {
    fetch(url)
      .then(res => res.text())
      .then(setContent)
      .catch(() => setContent('Failed to load content.'));
  }, [url]);

  return <ReactMarkdown>{content}</ReactMarkdown>;
}