import React from 'react';
import {
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '../../ui/navigation-menu';
import { community } from '../data';
import styles from './styles/CommunityMenu.module.css';

const CommunityMenu: React.FC = () => {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className={styles.menuTrigger}>
        Comunidad
      </NavigationMenuTrigger>
      <NavigationMenuContent className={styles.menuContent}>
        <div className={styles.contentHeader}>
          <h3 className={styles.contentTitle}>Únete a la Comunidad</h3>
        </div>
        <ul className={styles.menuList}>
          {community.map((item) => (
            <li key={item.title}>
              <NavigationMenuLink className={styles.menuLink}>
                {item.title}
              </NavigationMenuLink>
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};

export default CommunityMenu;
