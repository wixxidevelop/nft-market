'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateNFTPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', { formData, selectedFile });
  };

  return (
    <div className="flex flex-col justify-between">
      <main className="pt-8 pb-12 md:pb-14 lg:pb-16">
        <div className="max-w-[84rem] mx-auto px-3 md:px-5 flex flex-col gap-6 md:gap-8 lg:px-6">
          <div className="flex items-center gap-3 text-2xl md:text-3xl">
            <div>
              <svg 
                stroke="currentColor" 
                fill="none" 
                strokeWidth="2" 
                viewBox="0 0 24 24" 
                strokeLinecap="round"
                strokeLinejoin="round" 
                className="cursor-pointer" 
                height="1em" 
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
                onClick={() => router.back()}
              >
                <path d="m15 18-6-6 6-6"></path>
              </svg>
            </div>
            <h1 className="text-charcoal font-bold">Create NFT</h1>
          </div>
          
          <div className="grid lg:grid-cols-[2fr_1fr] gap-0 lg:gap-10">
            <div>
              <section className="flex flex-col gap-4 md:gap-6">
                <div className="text-mid-100 max-w-3xl">
                  <p>Images and videos are supported. Max size: 15 MB</p>
                </div>
                
                <form className="flex flex-col gap-8 md:gap-12" onSubmit={handleSubmit}>
                  {/* File Upload */}
                  <div className="space-y-1 flex flex-col gap-2">
                    <label
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 relative cursor-pointer rounded-lg aspect-[5/4] w-full md:rounded-xl lg:w-2/3 flex items-center justify-center border-2 border-dashed border-mid-200"
                      htmlFor="nft-file"
                      role="button"
                    >
                      {selectedFile ? (
                        <div className="text-center">
                          <p className="text-sm text-charcoal">{selectedFile.name}</p>
                          <p className="text-xs text-mid-200 mt-1">Click to change</p>
                        </div>
                      ) : (
                        <svg 
                          stroke="currentColor" 
                          fill="none" 
                          strokeWidth="2"
                          viewBox="0 0 24 24" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className="text-3xl md:text-4xl text-mid-200" 
                          height="1em" 
                          width="1em"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
                          <line x1="16" x2="22" y1="5" y2="5"></line>
                          <line x1="19" x2="19" y1="2" y2="8"></line>
                          <circle cx="9" cy="9" r="2"></circle>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                        </svg>
                      )}
                    </label>
                    <input
                      className="h-12 w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-base ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-neutral-500 focus-visible:ring-neutral-400 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300 hidden"
                      accept="image/*, video/*"
                      id="nft-file"
                      type="file"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Name Field */}
                  <div className="space-y-1">
                    <label
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      htmlFor="nft-name"
                    >
                      Name
                    </label>
                    <input
                      className="flex w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-base ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-neutral-500 focus-visible:ring-neutral-400 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300 h-14"
                      placeholder="NFT name"
                      id="nft-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Category and Price Grid */}
                  <div className="grid items-center gap-8 md:grid-cols-2 md:gap-4">
                    {/* Category */}
                    <div className="space-y-1">
                      <label
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        htmlFor="nft-category"
                      >
                        Category
                      </label>
                      <select
                        className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-2 text-base placeholder:text-neutral-500 focus:outline-none focus:ring-0 focus:border-neutral-400 focus:ring-neutral-950 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300 h-14"
                        id="nft-category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                      >
                        <option value="">Choose a category</option>
                        <option value="art">Art</option>
                        <option value="gaming">Gaming</option>
                        <option value="memberships">Memberships</option>
                        <option value="pfps">PFPs</option>
                        <option value="photography">Photography</option>
                        <option value="others">Others</option>
                      </select>
                    </div>

                    {/* Price */}
                    <div className="space-y-1">
                      <label
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        htmlFor="nft-price"
                      >
                        Price In wETH
                      </label>
                      <input
                        className="flex w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-base ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-neutral-500 focus-visible:ring-neutral-400 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300 h-14"
                        step="0.00001"
                        placeholder="Enter the price in wETH"
                        id="nft-price"
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      htmlFor="nft-description"
                    >
                      Description
                    </label>
                    <textarea
                      className="flex w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-base ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-neutral-400 focus-visible:ring-neutral-950 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300 resize-none min-h-[120px]"
                      placeholder="Provide a detailed description of your NFT."
                      name="description"
                      id="nft-description"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                    <div>Minting fee: 0.1 ETH</div>
                  </div>

                  {/* Submit Button */}
                  <section className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-lg ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-25 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90 px-6 py-2 gap-3 items-center h-14 w-full bg-brand font-bold hover:bg-brand/80"
                    >
                      <span>Create</span>
                    </button>
                  </section>
                </form>
              </section>
            </div>

            {/* Right Sidebar */}
            <div className="hidden flex-col py-4 gap-6 md:gap-8 lg:py-0 lg:gap-10 lg:flex">
              {/* Recent Transactions */}
              <section className="flex flex-col justify-between gap-4 py-6 px-6 rounded-xl bg-light-100 lg:bg-white lg:py-0 lg:px-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-mid-300">Recent Transactions</p>
                  <a href="/dashboard/transactions">
                    <button className="inline-flex items-center justify-center font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-25 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90 text-xs rounded-md h-7 px-3 bg-light-200 text-charcoal hover:bg-light-300 lg:bg-light-100 lg:hover:bg-light-200">
                      View All
                    </button>
                  </a>
                </div>
                <div className="flex flex-col gap-3 items-center justify-center my-4 md:my-6">
                  <p className="italic">No transactions yet.</p>
                  <a className="mt-3" href="/dashboard/deposit">
                    <button className="inline-flex items-center justify-center font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-25 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90 h-9 px-4 text-sm bg-light-200 hover:bg-light-200 text-charcoal rounded-md lg:bg-light-100 lg:hover:bg-light-200">
                      Make a deposit
                    </button>
                  </a>
                </div>
              </section>

              {/* Recent Sales */}
              <section className="flex flex-col justify-between gap-4 py-6 px-6 rounded-xl bg-light-100 lg:bg-white lg:py-0 lg:px-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-mid-300">Recent Sales</p>
                  <a href="/dashboard/sales">
                    <button className="inline-flex items-center justify-center font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-25 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90 text-xs rounded-md h-7 px-3 bg-light-200 text-charcoal hover:bg-light-300 lg:bg-light-100 lg:hover:bg-light-200">
                      View All
                    </button>
                  </a>
                </div>
                <div className="flex flex-col gap-3 items-center justify-center my-4 md:my-6">
                  <p className="italic">No sales yet.</p>
                  <a className="mt-3" href="/marketplace">
                    <button className="inline-flex items-center justify-center font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-25 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90 h-9 px-4 text-sm bg-light-200 hover:bg-light-200 text-charcoal rounded-md lg:bg-light-100 lg:hover:bg-light-200">
                      Make a sale
                    </button>
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}