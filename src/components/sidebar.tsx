import Link from 'next/link';
import { Icon } from './icons';
import { getCollections } from '@/lib/pages';
import { SidebarTree } from './sidebar-tree';
import styles from './sidebar.module.css';

export async function Sidebar() {
  const collections = await getCollections();

  return (
    <aside className={styles.aside}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionLabel}>Topic Stacks</div>
      </div>

      <SidebarTree collections={collections} />

      <div className={styles.divider} />

      <div className={styles.quickAccessLabel}>Quick Access</div>
      {[
        { label: 'All Cheatsheets', icon: 'list', href: '/cheatsheets' },
        { label: 'Ask the KB', icon: 'sparkles', href: '/ask' },
      ].map(({ label, icon, href }) => (
        <Link key={href} href={href} className={styles.quickLink}>
          <Icon name={icon} size={14} />
          <span>{label}</span>
        </Link>
      ))}
    </aside>
  );
}
