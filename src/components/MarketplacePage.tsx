'use client';

import React from 'react';

const MarketplacePage: React.FC = () => {
  return (
    <div className="flex flex-col justify-between min-h-[100dvh]">
      <div>
        <header className="fixed top-0 left-0 right-0 z-30 py-3 bg-white border-b border-light-300">
          <div className="max-w-[84rem] mx-auto px-3 md:px-5 lg:px-2">
            <div className="flex justify-between items-center">
              <section>
                <a href="/">
                  <img 
                    alt="Logo" 
                    fetchPriority="high" 
                    width="1875" 
                    height="601"
                    decoding="async" 
                    data-nimg="1" 
                    className="w-6 sm:w-6 md:w-8"
                    style={{color: 'transparent'}}
                    srcSet="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.a2464874.png&w=1920&q=75 1x, /_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.a2464874.png&w=3840&q=75 2x"
                    src="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.a2464874.png&w=3840&q=75" 
                  />
                </a>
              </section>
              <section className="flex items-center gap-4 md:gap-6">
                <button className="inline-flex items-center justify-center font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-25 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90 w-12 h-12 bg-white border border-light-300 text-black rounded-lg hover:bg-white">
                  <svg
                    stroke="currentColor" 
                    fill="none" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24"
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    height="24" 
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </svg>
                </button>
                <a href="/dashboard">
                  <div className="bg-white border border-light-300 py-1.5 px-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div>
                        <div>
                          <span className="relative flex shrink-0 overflow-hidden rounded-full h-9 w-9">
                            <span className="flex h-full w-full items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-charcoal uppercase">
                              m
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-1">
                        <p className="text-sm font-bold">meta3905</p>
                        <div></div>
                      </div>
                    </div>
                  </div>
                </a>
              </section>
            </div>
          </div>
        </header>
      </div>
      <main>
        <div className="h-[16rem] md:h-[20rem] relative gaming-bg bg-top bg-repeat">
          <div className="bg-gradient-to-b from-black/90 via-black/50 to-black/10 h-full">
            <div className="h-[68px]"></div>
            <div className="max-w-[84rem] mx-auto px-3 md:px-5 lg:px-2">
              <div className="absolute -bottom-8 flex items-center justify-center rounded-lg bg-white h-[4.5rem] w-[4.5rem] md:-bottom-12 md:h-[7.5rem] md:w-[7.5rem] md:rounded-xl">
                <img 
                  alt="Art PFP" 
                  loading="lazy" 
                  width="1000" 
                  height="750" 
                  decoding="async"
                  data-nimg="1" 
                  className="rounded-md h-16 w-16 md:h-28 md:w-28 md:rounded-lg"
                  style={{color: 'transparent'}}
                  src="https://i.postimg.cc/28b3VJm2/marketplace-pfp.webp" 
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Marketplace Stats Section */}
      <section className="py-8 bg-white">
        <div className="max-w-[84rem] mx-auto px-3 md:px-5 lg:px-2">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Marketplace</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">377,210</div>
                <div className="text-gray-600">Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">Ethereum</div>
                <div className="text-gray-600">Chain</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">29,223,603,862.892 ETH</div>
                <div className="text-gray-600">total volume</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">69%</div>
                <div className="text-gray-600">listed</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">20,368</div>
                <div className="text-gray-600">owners</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">59%</div>
                <div className="text-gray-600">unique owners</div>
              </div>
            </div>
            <p className="text-gray-700 mt-6 max-w-4xl mx-auto leading-relaxed">
              Explore a vibrant digital marketplace where creators and collectors come together to buy, sell, and trade unique NFTs. 
              Discover a wide range of digital assets, including art, collectibles, music, videos, and more, all authenticated on the 
              blockchain for proven ownership and rarity. <span className="text-blue-600 cursor-pointer hover:underline">See more</span>
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <section className="mt-8 mb-2 py-4 md:mt-14 md:mb-4">
          <div className="max-w-[84rem] mx-auto px-3 md:px-5 lg:px-2">
            <div className="flex flex-col gap-4">
              <span aria-live="polite" aria-busy="true">
                <span
                  className="react-loading-skeleton max-w-[16rem] h-16"
                  style={{'--base-color': '#f5f5f5', '--highlight-color': '#d4d4d4'} as React.CSSProperties}
                >
                  ‌
                </span>
                <br />
              </span>
              <span aria-live="polite" aria-busy="true">
                <span
                  className="react-loading-skeleton h-10 max-w-[60rem]"
                  style={{'--base-color': '#f5f5f5', '--highlight-color': '#d4d4d4'} as React.CSSProperties}
                >
                  ‌
                </span>
                <br />
              </span>
              <span aria-live="polite" aria-busy="true">
                <span 
                  className="react-loading-skeleton h-12 max-w-sm"
                  style={{'--base-color': '#f5f5f5', '--highlight-color': '#d4d4d4'} as React.CSSProperties}
                >
                  ‌
                </span>
                <br />
              </span>
            </div>
          </div>
        </section>
        <section className="py-6 mb-3 md:py-8 md:mb-4">
          <div className="max-w-[84rem] mx-auto px-3 md:px-5 lg:px-2">
            <div className="grid gap-4 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[...Array(10)].map((_, index) => (
                <span key={index} aria-live="polite" aria-busy="true">
                  <span
                    className="react-loading-skeleton rounded-xl h-[330px] xs:h-[220px] sm:h-[240px] md:h-[315px]"
                    style={{'--base-color': '#f5f5f5', '--highlight-color': '#d4d4d4'} as React.CSSProperties}
                  >
                    ‌
                  </span>
                  <br />
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <footer className="sticky bg-black text-white">
        <div className="max-w-[84rem] mx-auto px-3 md:px-5 lg:px-2">
          <section className="w-full py-8 space-y-4 md:hidden md:w-[90%] md:py-12 lg:w-3/4 xl:w-1/2">
            <img 
              alt="Logo" 
              fetchPriority="high" 
              width="1875" 
              height="601" 
              decoding="async" 
              data-nimg="1"
              className="w-36 sm:w-40 md:w-48" 
              style={{color: 'transparent'}}
              srcSet="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo-white.a2464874.png&w=1920&q=75 1x, /_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo-white.a2464874.png&w=3840&q=75 2x"
              src="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo-white.a2464874.png&w=3840&q=75" 
            />
            <p>Join our mailing list to stay in the loop with our newest feature releases, NFT drops, and tips and tricks for navigating Etheryte.</p>
            <form className="flex flex-col md:items-center gap-3 md:flex-row">
              <input 
                type="email"
                className="flex h-12 w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-base ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-neutral-500 focus-visible:ring-neutral-400 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300 max-w-lg text-charcoal"
                title="email" 
                placeholder="Enter your email address" 
                defaultValue="" 
              />
              <button className="inline-flex items-center justify-center rounded-lg ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90 h-11 px-6 py-2 gap-2 self-start bg-white/20 font-bold hover:bg-white/30 disabled:opacity-80">
                <span>Submit</span>
              </button>
            </form>
          </section>
          <section className="grid gap-8 border-t border-dark-100 py-8 md:py-12 md:border-none md:gap-2 md:grid-cols-[5fr_2fr_2fr_2fr] lg:grid-cols-[5fr_2fr_2fr_2fr]">
            <div className="hidden w-full space-y-4 md:block md:w-[90%]">
              <img 
                alt="Logo" 
                fetchPriority="high" 
                width="1875" 
                height="601" 
                decoding="async" 
                data-nimg="1"
                className="w-36 sm:w-40 md:w-48" 
                style={{color: 'transparent'}}
                srcSet="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo-white.a2464874.png&w=1920&q=75 1x, /_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo-white.a2464874.png&w=3840&q=75 2x"
                src="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo-white.a2464874.png&w=3840&q=75" 
              />
              <p>Join our mailing list to stay in the loop with our newest feature releases, NFT drops, and tips and tricks for navigating Etheryte.</p>
              <form className="space-y-3">
                <input 
                  type="email"
                  className="flex h-12 w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-base ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-neutral-500 focus-visible:ring-neutral-400 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300 max-w-lg text-charcoal"
                  title="email" 
                  placeholder="Enter your email address" 
                  defaultValue="" 
                />
                <button className="inline-flex items-center justify-center rounded-lg ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90 h-11 px-6 py-2 gap-2 bg-white/20 font-bold hover:bg-white/30 disabled:opacity-80">
                  <span>Submit</span>
                </button>
              </form>
            </div>
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-bold uppercase">My Account</h3>
              <div className="flex flex-col gap-2 text-light-200">
                <a className="self-start cursor-pointer hover:text-blue-400" href="/auth/login">Profile</a>
                <a className="self-start cursor-pointer hover:text-blue-400" href="/auth/login">Favorites</a>
                <a className="self-start cursor-pointer hover:text-blue-400" href="/auth/login">Watchlist</a>
                <a className="self-start cursor-pointer hover:text-blue-400" href="/auth/login">Collections</a>
                <a className="self-start cursor-pointer hover:text-blue-400" href="/auth/login">Mint</a>
              </div>
            </div>
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-bold uppercase">Categories</h3>
              <div className="flex flex-col gap-2 text-light-200">
                <a className="self-start hover:text-blue-400" href="/category/art">
                  <div>Art</div>
                </a>
                <a className="self-start hover:text-blue-400" href="/category/gaming">
                  <div>Gaming</div>
                </a>
                <a className="self-start hover:text-blue-400" href="/category/memberships">
                  <div>Memberships</div>
                </a>
                <a className="self-start hover:text-blue-400" href="/category/pfps">
                  <div>PFPs</div>
                </a>
                <a className="self-start hover:text-blue-400" href="/category/photography">
                  <div>Photography</div>
                </a>
                <a className="self-start hover:text-blue-400" href="/category/others">
                  <div>Others</div>
                </a>
              </div>
            </div>
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-bold uppercase">Company</h3>
              <div className="flex flex-col gap-2 text-light-200">
                <a className="self-start hover:text-blue-400" href="https://etherscan.io/token/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2?a=0x1681195C176239ac5E72d9aeBaCf5b2492E0C4ee">
                  <div>Transaction History (Block Explorer)</div>
                </a>
                <a className="self-start hover:text-blue-400" href="/privacy-policy">
                  <div>Privacy Policy</div>
                </a>
                <a className="self-start hover:text-blue-400" href="/terms-of-service">
                  <div>Terms of Service</div>
                </a>
              </div>
            </div>
          </section>
          <section className="flex flex-col items-center text-sm justify-between py-2 border-t border-dark-100 md:py-4 md:flex-row md:text-base">
            <div>© 2018 - 2025 Etheryte, Inc</div>
            <div className="flex items-center divide-x-2 divide-dark-100">
              <a className="pr-2 hover:text-blue-400 md:pr-3" href="/privacy-policy">Privacy Policy</a>
              <a className="pl-2 hover:text-blue-400 md:pl-3" href="/terms-of-service">Terms of Service</a>
            </div>
          </section>
        </div>
      </footer>
    </div>
  );
};

export default MarketplacePage;