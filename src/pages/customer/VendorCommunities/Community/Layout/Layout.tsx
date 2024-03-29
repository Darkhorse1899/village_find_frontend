import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';

import {
  CommunityAbout,
  CommunityVendors,
} from '@/pages/customer/VendorCommunities';

import { Container } from '@/components/layout/customer';
import { Button, Select } from '@/components/forms';

import { HttpService } from '@/services';

import { SERVER_URL } from '@/config/global';

import styles from './Layout.module.scss';

const initialNavItems = [
  { name: 'Vendors', value: 'vendor' },
  { name: 'About', value: 'about' },
  { name: 'Join Our Community', value: 'join' },
];

export function Layout() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();

  const [community, setCommunity] = useState<any>({});
  const [currentTab, setCurrentTab] = useState('vendor');
  const [products, setProducts] = useState<any[]>([]);

  const initialPath = `/communities/${slug}`;

  const onNavItemClick = (item: string) => {
    if (item == 'join') {
      onJoinClick();
      return;
    }
    navigate(`${initialPath}?tab=${item}`);
  };

  const onJoinClick = () => {
    if (!community.code) return;
    navigate(`/sign-up/vendor?community=${community.code}`);
  };

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const response = await HttpService.get(`/communities?slug=${slug}`);
      const { status, community } = response;
      if (status === 200) {
        setCommunity(community ?? {});
        const products = await HttpService.get('/products/public', {
          community: community._id,
        });
        setProducts(products || []);
      } else {
        enqueueSnackbar('Community not found!', { variant: 'error' });
        navigate('/communities');
        return;
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!searchParams) return;
    const tab = searchParams.get('tab') || 'vendor';
    setCurrentTab(tab);
  }, [searchParams]);

  return (
    <div className={styles.root}>
      <Container className={styles.container}>
        <Select
          rounded="full"
          border="none"
          options={initialNavItems}
          bgcolor="primary"
          value={currentTab}
          updateValue={onNavItemClick}
          className={styles.navItems}
        />
        <div className={styles.header}>
          <div className={styles.vendor}>
            <div className={styles.image}>
              <img
                alt="Community logo image"
                src={`${SERVER_URL}/${
                  community.images && community.images.logoUrl
                }`}
              />
            </div>
            <div className={styles.text}>
              <p className={styles.title}>{community.name}</p>
              <p className={styles.body}>{community.shortDesc}</p>
            </div>
          </div>
          <div className={styles.links}>
            {initialNavItems.slice(0, 2).map((item: any, index: number) => (
              <p
                key={index}
                className={currentTab === item.value ? styles.active : ''}
                onClick={() => navigate(`${initialPath}?tab=${item.value}`)}
              >
                {item.name}
              </p>
            ))}
            <Button className={styles.joinButton} onClick={onJoinClick}>
              Join Our Community
            </Button>
          </div>
        </div>
      </Container>
      {currentTab === 'vendor' ? (
        <CommunityVendors
          announcement={community.announcement ?? {}}
          vendors={community.vendors ?? []}
          products={products}
          events={community.events ?? []}
        />
      ) : (
        <CommunityAbout />
      )}
    </div>
  );
}
