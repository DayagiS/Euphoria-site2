
import React, { useState, useEffect, useRef } from 'react';
import { PRODUCTS, ExtendedProduct, BRAND_PHONE } from './constants';
import { CartItem, Product, OrderData } from './types';
import Header from './components/Header';
import { generateOrderNotification } from './services/geminiService';

const App: React.FC = () => {
  const [customImages, setCustomImages] = useState<{ [key: string]: string }>(() => {
    try {
      const saved = localStorage.getItem('euphoria_v3_images');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [isLocked, setIsLocked] = useState(() => {
    const saved = localStorage.getItem('euphoria_site_locked');
    return saved === null ? true : saved === 'true';
  });

  const [activeImageIndex, setActiveImageIndex] = useState<{ [key: string]: number }>(() => {
    try {
      const saved = localStorage.getItem('euphoria_slot_state');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [view, setView] = useState<'shop' | 'bag' | 'checkout'>('shop');
  const [orderComplete, setOrderComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [shippingMethod, setShippingMethod] = useState<'modiin' | 'israel' | null>(null);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem('euphoria_v3_images', JSON.stringify(customImages));
        localStorage.setItem('euphoria_slot_state', JSON.stringify(activeImageIndex));
      } catch (e) {}
    }, 500); 
    return () => clearTimeout(timeout);
  }, [customImages, activeImageIndex]);

  useEffect(() => {
    localStorage.setItem('euphoria_site_locked', String(isLocked));
  }, [isLocked]);

  const handleImageUpload = (productId: string, imageIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200; 

          if (width > height) {
            if (width > maxDimension) {
              height *= maxDimension / width;
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width *= maxDimension / height;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
            setCustomImages(prev => ({ ...prev, [`${productId}-${imageIndex}`]: compressedBase64 }));
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleImage = (productId: string, totalImages: number) => {
    setActiveImageIndex(prev => ({
      ...prev,
      [productId]: ((prev[productId] || 0) + 1) % totalImages
    }));
  };

  const addToCart = (product: ExtendedProduct, redirect: boolean = false) => {
    if (!selectedSize || selectedProduct?.id !== product.id) {
      alert("Select your size.");
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.selectedSize === selectedSize);
      if (existing) {
        return prev.map(item => 
          (item.product.id === product.id && item.selectedSize === selectedSize) 
          ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, selectedSize, quantity: 1 }];
    });

    if (redirect) setView('bag');
    else alert("Added to bag.");
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shippingCost = shippingMethod === 'israel' ? 40 : 0;
  const cartTotal = cartSubtotal + shippingCost;

  const finalizeOrder = async () => {
    if (!shippingMethod) return;
    setIsProcessing(true);
    const orderData: OrderData = {
      customerName: formData.name,
      phone: formData.phone,
      address: formData.address,
      cart: cart,
      subtotal: cartSubtotal,
      total: cartTotal,
      shippingMethod: shippingMethod,
      shippingCost: shippingCost,
      paymentMethod: 'bit'
    };

    const notification = await generateOrderNotification(orderData);
    console.log("ORDER PROCESSED:", notification);
    
    setTimeout(() => {
      setIsProcessing(false);
      setCart([]);
      setFormData({ name: '', phone: '', address: '' });
      setShippingMethod(null);
      setView('shop');
      setOrderComplete(true);
      setTimeout(() => setOrderComplete(false), 8000);
    }, 2000);
  };

  return (
    <div className={`min-h-screen bg-white font-light selection:bg-black selection:text-white ${isLocked ? 'is-production' : 'is-editor'}`}>
      <Header 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
        onCartClick={() => setView('bag')} 
        onLogoClick={() => setView('shop')}
      />
      
      <main className="max-w-6xl mx-auto pt-32 pb-40 px-6">
        {orderComplete && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-black text-white px-8 py-4 shadow-2xl fade-in text-center rounded-sm">
            <span className="tracking-[0.3em] text-[10px] uppercase block font-medium mb-1">Order Placed</span>
            <span className="text-[8px] uppercase tracking-widest opacity-60">Complete Bit transfer to {BRAND_PHONE}</span>
          </div>
        )}

        {view === 'shop' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-32 fade-in">
            {PRODUCTS.map((product) => {
              const currentIndex = activeImageIndex[product.id] || 0;
              const customImgKey = `${product.id}-${currentIndex}`;
              const displayImage = customImages[customImgKey] || product.images[currentIndex];

              return (
                <div key={product.id} className="group flex flex-col">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#fafafa] mb-10 border border-gray-50">
                    <img 
                      src={displayImage} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-[1.2s] ease-out group-hover:scale-105 cursor-pointer"
                      onClick={() => toggleImage(product.id, product.images.length)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/1200x1600/fcfcfc/d1d1d1?text=${product.name}`;
                      }}
                    />
                    
                    {!isLocked && (
                      <div className="absolute top-6 right-6 flex flex-col space-y-3 opacity-0 group-hover:opacity-100 transition-all">
                        <label className="bg-black text-white p-4 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-xl pointer-events-auto">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(product.id, currentIndex, e)} />
                        </label>
                      </div>
                    )}
                    
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3">
                      {product.images.map((_, i) => (
                        <button 
                          key={i}
                          onClick={() => setActiveImageIndex({...activeImageIndex, [product.id]: i})}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${currentIndex === i ? 'bg-black w-8' : 'bg-black/10'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-8 px-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h2 className="text-[12px] uppercase tracking-[0.4em] font-medium text-black">{product.name}</h2>
                        <p className="text-[10px] text-gray-400 tracking-[0.1em] leading-relaxed max-w-[280px]">{product.description}</p>
                      </div>
                      <span className="text-[11px] tracking-widest font-medium text-black">₪{product.price}</span>
                    </div>

                    <div className="space-y-6 pt-4">
                      <div className="flex flex-wrap gap-4">
                        {product.sizes.map(size => {
                          const isSoldOut = (product as ExtendedProduct).soldOutSizes?.includes(size);
                          return (
                            <button
                              key={size}
                              disabled={isSoldOut}
                              onClick={() => { setSelectedProduct(product); setSelectedSize(size); }}
                              className={`
                                text-[10px] w-12 h-12 border flex items-center justify-center transition-all duration-500 rounded-sm
                                ${isSoldOut ? 'opacity-10 cursor-not-allowed border-gray-100' : 'hover:border-black'}
                                ${selectedProduct?.id === product.id && selectedSize === size ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-400'}
                              `}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => addToCart(product as ExtendedProduct, true)}
                          className="bg-black text-white py-5 text-[9px] uppercase tracking-[0.6em] hover:bg-black/90 transition-colors"
                        >
                          Buy Now
                        </button>
                        <button 
                          onClick={() => addToCart(product as ExtendedProduct)}
                          className="border border-black py-5 text-[9px] uppercase tracking-[0.6em] hover:bg-black hover:text-white transition-all duration-500"
                        >
                          Add to Bag
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'bag' && (
          <div className="max-w-xl mx-auto fade-in">
            <h2 className="text-[13px] uppercase tracking-[0.6em] mb-20 text-center font-medium">Your Selection</h2>
            {cart.length === 0 ? (
              <div className="text-center py-32 border-y border-gray-50">
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em]">Your bag is currently empty</p>
                <button onClick={() => setView('shop')} className="mt-12 text-[9px] uppercase tracking-[0.5em] border-b border-black pb-2 opacity-60 hover:opacity-100 transition-opacity">Continue Shopping</button>
              </div>
            ) : (
              <div className="space-y-16">
                {cart.map((item, idx) => (
                  <div key={`${item.product.id}-${item.selectedSize}`} className="flex gap-10 items-start pb-12 border-b border-gray-50">
                    <img src={customImages[`${item.product.id}-0`] || item.product.images[0]} className="w-28 aspect-[3/4] object-cover bg-gray-50" alt="" />
                    <div className="flex-1 space-y-4 pt-2">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-[11px] uppercase tracking-[0.3em] font-medium text-black">{item.product.name}</h3>
                        <span className="text-[11px] font-medium">₪{item.product.price * item.quantity}</span>
                      </div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">Size: {item.selectedSize}</p>
                      <div className="flex items-center space-x-6 pt-6">
                        <div className="flex items-center space-x-4 border border-gray-100 px-3 py-1.5">
                          <button onClick={() => {
                            const newCart = [...cart];
                            if (newCart[idx].quantity > 1) { newCart[idx].quantity--; setCart(newCart); }
                          }} className="text-gray-400 hover:text-black">-</button>
                          <span className="text-[10px] min-w-[12px] text-center">{item.quantity}</span>
                          <button onClick={() => {
                            const newCart = [...cart];
                            newCart[idx].quantity++; setCart(newCart);
                          }} className="text-gray-400 hover:text-black">+</button>
                        </div>
                        <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-[8px] uppercase tracking-[0.3em] text-gray-300 hover:text-red-400 transition-colors">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-10 space-y-10">
                  <div className="flex justify-between items-center text-[12px] uppercase tracking-[0.4em]">
                    <span className="opacity-40">Subtotal</span>
                    <span className="font-medium text-black">₪{cartSubtotal}</span>
                  </div>
                  <button onClick={() => setView('checkout')} className="w-full bg-black text-white py-6 text-[10px] uppercase tracking-[0.6em] shadow-xl hover:translate-y-[-2px] transition-transform">
                    Checkout with Bit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'checkout' && (
          <div className="max-w-md mx-auto fade-in">
             <h2 className="text-[13px] uppercase tracking-[0.6em] mb-20 text-center font-medium">Shipping Details</h2>
             <div className="space-y-10">
                <div className="space-y-2">
                  <label className="text-[8px] uppercase tracking-[0.4em] text-gray-400 mb-1 block">Full Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border-b border-gray-100 py-3 text-[12px] outline-none focus:border-black transition-colors bg-transparent" placeholder="Enter name" />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] uppercase tracking-[0.4em] text-gray-400 mb-1 block">Phone Number</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border-b border-gray-100 py-3 text-[12px] outline-none focus:border-black transition-colors bg-transparent" placeholder="05x-xxxxxxx" />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] uppercase tracking-[0.4em] text-gray-400 mb-1 block">Shipping Address</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border-b border-gray-100 py-3 text-[12px] outline-none focus:border-black transition-colors bg-transparent" placeholder="Street, City, Zip" />
                </div>

                <div className="space-y-6">
                  <label className="text-[8px] uppercase tracking-[0.4em] text-gray-400 mb-1 block">Shipping Method</label>
                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => setShippingMethod('modiin')}
                      className={`text-left p-6 border rounded-sm transition-all duration-300 ${shippingMethod === 'modiin' ? 'border-black bg-black/5' : 'border-gray-100 hover:border-black'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase tracking-widest font-medium">Modiin Delivery</span>
                        <span className="text-[10px] font-medium">Free</span>
                      </div>
                      <p className="text-[8px] text-gray-400 uppercase tracking-widest leading-relaxed">Write us in Instegram to coordinate</p>
                    </button>
                    
                    <button 
                      onClick={() => setShippingMethod('israel')}
                      className={`text-left p-6 border rounded-sm transition-all duration-300 ${shippingMethod === 'israel' ? 'border-black bg-black/5' : 'border-gray-100 hover:border-black'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase tracking-widest font-medium">Inside Israel</span>
                        <span className="text-[10px] font-medium">₪40</span>
                      </div>
                      <p className="text-[8px] text-gray-400 uppercase tracking-widest">Standard shipping (3-5 business days)</p>
                    </button>
                  </div>
                </div>

                <div className="pt-16 space-y-8">
                  <div className="bg-[#fafafa] border border-gray-50 p-8 rounded-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase tracking-[0.4em] font-medium text-black">Payment via BIT</span>
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold italic shadow-inner">bit</div>
                    </div>
                    
                    <div className="space-y-3 pt-6 border-t border-gray-100">
                      <div className="flex justify-between text-[9px] uppercase tracking-widest opacity-60">
                        <span>Subtotal</span>
                        <span>₪{cartSubtotal}</span>
                      </div>
                      <div className="flex justify-between text-[9px] uppercase tracking-widest opacity-60">
                        <span>Shipping</span>
                        <span>{shippingCost > 0 ? `₪${shippingCost}` : 'FREE'}</span>
                      </div>
                      <div className="flex justify-between text-[11px] uppercase tracking-widest font-medium pt-2">
                        <span>Total Amount</span>
                        <span>₪{cartTotal}</span>
                      </div>
                    </div>

                    <p className="text-[9px] text-gray-400 leading-relaxed uppercase tracking-widest opacity-60">
                      Transfer to <span className="text-black font-medium">{BRAND_PHONE}</span> after placing order.
                    </p>
                  </div>
                  
                  <button 
                    disabled={isProcessing || !formData.name || !formData.phone || !formData.address || !shippingMethod}
                    onClick={finalizeOrder}
                    className="w-full bg-black text-white py-6 text-[10px] uppercase tracking-[0.7em] disabled:opacity-20 transition-all flex items-center justify-center space-x-4 shadow-2xl"
                  >
                    {isProcessing ? <span className="animate-pulse">Placing Order...</span> : <span>Confirm Order</span>}
                  </button>
                  <button onClick={() => setView('bag')} className="w-full text-[8px] uppercase tracking-[0.4em] text-gray-300 hover:text-black transition-colors">Return to bag</button>
                </div>
             </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-10 right-10 flex items-center space-x-4 z-[300]">
        {!isLocked && (
          <button 
            onClick={() => { if (confirm("Remove all custom images?")) { localStorage.removeItem('euphoria_v3_images'); window.location.reload(); } }}
            className="bg-white border border-gray-100 p-4 rounded-full text-[9px] uppercase tracking-widest text-red-400 hover:bg-red-50 transition-colors shadow-xl"
          >
            Clear All
          </button>
        )}
        <button 
          onClick={() => setIsLocked(!isLocked)}
          className={`p-5 rounded-full shadow-2xl transition-all duration-700 flex items-center space-x-4 ${isLocked ? 'bg-black text-white' : 'bg-white text-black border border-gray-100'}`}
        >
          <span className="text-[9px] uppercase tracking-[0.5em] font-medium pl-2">{isLocked ? 'Manage' : 'Lock Site'}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isLocked ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            )}
          </svg>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        body { background-color: #ffffff; letter-spacing: 0.05em; }
        input::placeholder { color: #d1d5db; }
      `}} />
    </div>
  );
};

export default App;
