import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaChevronUp, FaMinus, FaPlus } from 'react-icons/fa6';
import { enqueueSnackbar } from 'notistack';

import { ImageUpload, Select, TextField, Button } from '@/components/forms';

import { HttpService } from '@/services';
import { IOrderDetail } from '@/pages/customer/ProductDetails';
import { SERVER_URL } from '@/config/global';

import styles from './ProductInfo.module.scss';
import clsx from 'clsx';
import { ChangeInputEvent } from '@/interfaces';

interface ICartProduct {
  styleID: string;
  quantity: number;
  image: File | null;
}

export function ProductInfo({
  name,
  vendor,
  community,
  styles: types,
  inventories,
  customization = { fee: 0, customText: '' },
  subscription,
  soldByUnit,
  deliveryTypes,
}: IOrderDetail) {
  const [cartProduct, setCartProduct] = useState<ICartProduct>({
    styleID: '',
    quantity: 0,
    image: null,
  });
  const [attributes, setAttributes] = useState<
    {
      _id: string;
      value: string;
    }[]
  >([]);
  const [isPersonalized, setIsPersonalized] = useState<Boolean>(false);
  const [customMessage, setCustomMessage] = useState('');

  const defaultPrice = useMemo(
    () => (inventories.length && inventories[0].price) || 0,
    [inventories],
  );
  const defaultDiscount = useMemo(
    () => (types.length && types[0].discount) || 0,
    [styles],
  );
  const defaultOffPrice = useMemo(
    () => (defaultPrice * (100 - defaultDiscount)) / 100.0,
    [defaultPrice, defaultDiscount],
  );
  const defaultImage = useMemo(() => {
    return inventories.find((invent: any) => invent.image)?.image || '';
  }, [inventories]);

  const selectedStyle = useMemo(() => {
    return types.find((type: any) => type._id === cartProduct.styleID);
  }, [cartProduct.styleID]);
  const selectedInvent = useMemo(() => {
    return inventories.find((item: any) =>
      attributes.every(
        (attribute: { _id: string; value: string }) =>
          item.attrs[attribute._id] === attribute.value,
      ),
    );
  }, [attributes, inventories]);

  const productPrice = useMemo(() => {
    return (selectedInvent && selectedInvent.price) || defaultPrice;
  }, [selectedInvent, defaultPrice]);
  const productDiscount = useMemo(() => {
    return (
      (subscription && subscription.discount) ||
      (selectedStyle && selectedStyle.discount) ||
      defaultDiscount
    );
  }, [selectedStyle, defaultDiscount, subscription]);
  const productOffPrice = useMemo(() => {
    return (productPrice * (100 - productDiscount)) / 100.0 || defaultOffPrice;
  }, [productPrice, productDiscount, defaultOffPrice]);
  const productImage = useMemo(() => {
    return (selectedInvent && selectedInvent.image) || defaultImage;
  }, [selectedInvent]);

  const onMinusClick = () => {
    if (cartProduct.quantity === 0) return;
    setCartProduct({ ...cartProduct, quantity: cartProduct.quantity - 1 });
  };

  const onPlusClick = () => {
    setCartProduct({ ...cartProduct, quantity: cartProduct.quantity + 1 });
  };

  const onStyleChange = (id: string) => {
    setCartProduct({ ...cartProduct, styleID: id });
  };

  const onImageChange = (imageSrc: File) => {
    setCartProduct({ ...cartProduct, image: imageSrc });
  };

  const onAddCartClick = () => {
    if (!selectedStyle) {
      enqueueSnackbar('Please select one of product styles.', {
        variant: 'warning',
      });
      return;
    }
    if (selectedStyle.attributes.length != Object.keys(attributes).length) {
      enqueueSnackbar('Please select product attributes.', {
        variant: 'warning',
      });
      return;
    }
    if (!selectedInvent) {
      enqueueSnackbar('Invalid product attribute selection.', {
        variant: 'warning',
      });
      return;
    }
    if (!cartProduct.quantity) {
      enqueueSnackbar('Please select at least a product.', {
        variant: 'warning',
      });
      return;
    }

    const cartForm = new FormData();
    cartForm.append('inventoryId', selectedInvent._id);
    cartForm.append('vendorId', vendor._id);
    cartForm.append('price', `${productOffPrice}`);
    cartForm.append('quantity', cartProduct.quantity.toString());
    cartForm.append('isPersonalized', `${isPersonalized}`);
    if (isPersonalized) {
      cartForm.append('personFee', customization.fee.toString());
      cartForm.append('personMessage', customMessage);
    }
    cartForm.append('image', cartProduct.image as File);
    HttpService.post('/cart', cartForm).then(response => {
      const { status } = response;
      if (status === 200) {
        enqueueSnackbar(`Product: ${name} added to cart.`, {
          variant: 'success',
        });
      } else if (status === 400) {
        enqueueSnackbar('Alrady purchased same product type.', {
          variant: 'warning',
        });
      } else {
        enqueueSnackbar('Something went wrong.', { variant: 'error' });
      }
    });
  };

  const onAttributeChange = (attrId: string) => (value: string) => {
    if (attributes.find(item => item._id === attrId)) {
      setAttributes(
        attributes.map(item =>
          item._id === attrId ? { _id: item._id, value } : item,
        ),
      );
    } else {
      setAttributes([...attributes, { _id: attrId, value }]);
    }
  };

  const onMessageChange = (e: ChangeInputEvent) => {
    if (e.target.value.length > 500) return;
    setCustomMessage(e.target.value);
  };

  const onVendorClick = () => {};

  const onCommunityClick = () => {};

  return (
    <div className={styles.root}>
      <div className={styles.link}>
        <p className={styles.toVendor} onClick={onVendorClick}>
          {vendor.shopName}
        </p>
        <p className={styles.toCommunity} onClick={onCommunityClick}>
          {community.name}
        </p>
      </div>
      <div className={styles.blank}></div>
      <div className={styles.images}>
        <div className={styles.smallImages}>
          {inventories
            .filter((inventory: any) => inventory.image)
            .map((inventory: any) => (
              <img
                key={inventory._id}
                src={`${SERVER_URL}/${inventory.image}`}
                className={clsx({
                  [styles.active]:
                    selectedInvent && selectedInvent._id === inventory._id,
                })}
              />
            ))}
        </div>
        <img
          src={`${SERVER_URL}/${productImage}`}
          className={styles.topicImage}
        />
        <img />
      </div>
      <div className={styles.info}>
        <div className={styles.head}>
          <p>{name}</p>
        </div>
        <div className={styles.style}>
          <p className={styles.lowerPrice}>${productOffPrice.toFixed(2)}</p>
          <p
            className={clsx(styles.realPrice, {
              hidden: productDiscount === 0,
            })}
          >
            <span className={styles.totalPrice}>
              ${productPrice.toFixed(2)}
            </span>{' '}
            <span className={styles.discount}>
              {productDiscount.toFixed(2)}% off
            </span>
          </p>
          <p className={styles.centPrice}>
            Minimum {1} {soldByUnit} at ${productPrice}/{soldByUnit}
          </p>
          <div className={styles.style}>
            <Select
              placeholder="Style"
              options={types.map((style: { _id: string; name: string }) => ({
                ...style,
                value: style._id,
              }))}
              value={cartProduct.styleID}
              updateValue={onStyleChange}
              className={styles.styleSelect}
            />
            {selectedStyle &&
              selectedStyle.attributes.map((attribute: any) => (
                <Select
                  className={styles.styleSelect}
                  placeholder={attribute.name}
                  options={attribute.values}
                  value={
                    attributes.find(item => item._id === attribute._id)
                      ?.value || ''
                  }
                  updateValue={onAttributeChange(attribute._id)}
                />
              ))}
          </div>
        </div>
        <div className={styles.personalization}>
          <div
            className={styles.dropdown}
            onClick={() => setIsPersonalized(!isPersonalized)}
          >
            <p>Add personalization</p>
            {!isPersonalized ? (
              <FaChevronDown size={15} />
            ) : (
              <FaChevronUp size={15} />
            )}
          </div>
          <p className={clsx({ hidden: !isPersonalized })}>
            Personalization Fee: <span>${customization.fee.toFixed(2)}</span>
          </p>
        </div>
        <div className={clsx(styles.message, { hidden: !isPersonalized })}>
          <div className={styles.example}>
            <p>{customization.customText}</p>
          </div>
          <div className={styles.msgInput}>
            <TextField
              rows={4}
              placeholder="Type here"
              value={customMessage}
              updateValue={onMessageChange}
              className={
                customMessage.length === 500 ? styles.dangerMessage : ''
              }
            />
            <div
              className={clsx(styles.alerts, {
                [styles.warning]: customMessage.length === 500,
              })}
            >
              <span
                className={clsx(styles.invalidLength, {
                  hidden: customMessage.length !== 500,
                })}
              >
                The message must be a maximum of 500 characters.
              </span>
              <span className={styles.letterLength}>
                {500 - customMessage.length}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.logo}>
          <p>Add your logo or image here</p>
          <ImageUpload
            exWidth={0}
            exHeight={0}
            updateBaseImage={onImageChange}
          />
        </div>
        <div className={styles.quantity}>
          <span className={styles.minus} onClick={onMinusClick}>
            <FaMinus size={20} />
          </span>
          <p>{cartProduct.quantity}cnt</p>
          <span className={styles.plus} onClick={onPlusClick}>
            <FaPlus size={20} fill="white" />
          </span>
        </div>
        <Button className={styles.addToCartBtn} onClick={onAddCartClick}>
          Add to Cart
        </Button>
        {deliveryTypes.includes('Local Subscriptions') && (
          <div className={styles.local}>
            <p className={styles.header}>Subscription Information</p>
            <p className={styles.factor}>
              Fulfillment Day: <span>Determined at checkout</span>
            </p>
            <p className={clsx(styles.factor, styles.concern)}>
              Subscription Duration: <span>{subscription?.duration} weeks</span>
            </p>
            <p className={clsx(styles.factor, styles.concern)}>
              Subscription Frequency: <span>{subscription?.frequency}</span>
            </p>
            <p className={styles.hint}>
              <span>Your card will be charged </span>${productPrice} every{' '}
              {subscription?.duration} weeks <span>or until cancelation</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
