import { Github, Globe, Linkedin, Mail, Rss, Twitter } from 'lucide-react';

const ICONS = {
  github: Github,
  mail: Mail,
  twitter: Twitter,
  x: Twitter,
  rss: Rss,
  linkedin: Linkedin,
} as const;

export function SocialIcon({ name, size = 15 }: { name: string; size?: number }) {
  const Icon = ICONS[name.toLowerCase() as keyof typeof ICONS] ?? Globe;
  return <Icon size={size} aria-hidden="true" />;
}
