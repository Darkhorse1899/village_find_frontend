import { useEffect, useRef, useState } from 'react';
import { FaChevronUp, FaChevronDown, FaChevronRight } from 'react-icons/fa6';
import clsx from 'clsx';

import { useOnClickOutside } from '@/utils';

import styles from './Dropdown.module.scss';

interface IRoute {
  name: string;
  children?: IRoute[];
}

interface IDropdownProps {
  children: React.ReactNode;
  routes: IRoute[];
  position?: 'left' | 'right';
}

export function Dropdown({
  children,
  routes,
  position = 'left',
}: IDropdownProps) {
  const [isDropped, setIsDropped] = useState(false);
  const [itemState, setItemState] = useState<{ [key: string]: boolean }>({});
  const selectRef = useRef<HTMLDivElement>(null);

  const onItemDrop = (key: string) => {
    setItemState({
      ...itemState,
      [key]: !itemState[key],
    });
  };

  const renderRoutes = (parent: IRoute[], level: number) => {
    return (
      <div className={styles.dropboxPanel}>
        {parent.map((item: IRoute, index: number) => (
          <>
            <div className={styles.dropboxItem}>
              <p key={index} onClick={() => onItemDrop(`${level}-${index}`)}>
                {item.name}
              </p>
              {item.children && <FaChevronRight />}
            </div>
            {item.children &&
              !!itemState[`${level}-${index}`] &&
              renderRoutes(item.children, level + 1)}
          </>
        ))}
      </div>
    );
  };

  const onHideDropbox = () => {
    setIsDropped(false);
    setItemState({});
  };

  const onSelectClick = () => {
    if (isDropped) {
      onHideDropbox();
    } else {
      setIsDropped(true);
    }
  };

  useEffect(() => {
    useOnClickOutside(selectRef, onHideDropbox, 'mousedown');
  }, []);

  return (
    <div
      className={clsx(styles.root, {
        [styles.rightDrop]: position === 'right',
      })}
      ref={selectRef}
    >
      <div className={styles.select} onClick={onSelectClick}>
        <>{children}</>
        {isDropped ? <FaChevronUp /> : <FaChevronDown />}
      </div>
      {isDropped && renderRoutes(routes, 1)}
    </div>
  );
}
