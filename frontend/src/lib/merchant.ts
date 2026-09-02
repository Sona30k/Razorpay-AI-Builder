export type MerchantProduct = { product: string; views: number; detailViews: number; addToCart: number; purchases: number; revenue: number };
export type ProductCombination = { product: string; relatedProduct: string; customersPurchasingBoth: number };
export type MerchantData = { products: MerchantProduct[]; combinations: ProductCombination[] };
export type MerchantOpportunity = { id: string; type: "upsell" | "cross_sell" | "product_improvement" | "campaign"; title: string; priority: "High" | "Medium" | "Low"; product: string; relatedProduct: string; evidence: string; recommendation: string; expectedImpact: string; metrics: string[] };

export const merchantData: MerchantData = {
  products: [
    { product: "Laptop Stand", views: 12400, detailViews: 8600, addToCart: 2100, purchases: 1240, revenue: 1240000 },
    { product: "Mechanical Keyboard", views: 9200, detailViews: 6700, addToCart: 1600, purchases: 850, revenue: 850000 },
    { product: "Wireless Mouse", views: 18600, detailViews: 11900, addToCart: 1750, purchases: 690, revenue: 414000 },
    { product: "Premium Desk Mat", views: 6800, detailViews: 4900, addToCart: 920, purchases: 430, revenue: 344000 },
    { product: "Monitor Arm", views: 7400, detailViews: 5300, addToCart: 760, purchases: 310, revenue: 558000 },
  ],
  combinations: [
    { product: "Laptop Stand", relatedProduct: "Mechanical Keyboard", customersPurchasingBoth: 38 },
    { product: "Laptop Stand", relatedProduct: "Wireless Mouse", customersPurchasingBoth: 26 },
    { product: "Mechanical Keyboard", relatedProduct: "Premium Desk Mat", customersPurchasingBoth: 22 },
  ],
};

export function merchantTotals(data: MerchantData) {
  const revenue = data.products.reduce((total, item) => total + item.revenue, 0);
  const orders = data.products.reduce((total, item) => total + item.purchases, 0);
  const views = data.products.reduce((total, item) => total + item.views, 0);
  return { revenue, orders, views, averageOrderValue: Math.round(revenue / orders), conversionRate: Number(((orders / views) * 100).toFixed(1)) };
}

export function demoMerchantGrowth(data: MerchantData): MerchantOpportunity[] {
  const stand = data.products.find((item) => item.product === "Laptop Stand")!;
  const mouse = data.products.find((item) => item.product === "Wireless Mouse")!;
  const arm = data.products.find((item) => item.product === "Monitor Arm")!;
  const keyboard = data.products.find((item) => item.product === "Mechanical Keyboard")!;
  const combo = data.combinations.find((item) => item.product === "Laptop Stand" && item.relatedProduct === "Mechanical Keyboard")!;
  return [
    { id: "cross-sell-keyboard", type: "cross_sell", title: "Recommend a Mechanical Keyboard at checkout", priority: "High", product: stand.product, relatedProduct: keyboard.product, evidence: `${combo.customersPurchasingBoth}% of Laptop Stand customers also purchase a Mechanical Keyboard.`, recommendation: "Add a Mechanical Keyboard recommendation in the Laptop Stand cart and checkout flow.", expectedImpact: "Increase cross-sell conversion for workstation purchases.", metrics: [`Product views: ${stand.views.toLocaleString("en-IN")}`, `Purchases: ${stand.purchases.toLocaleString("en-IN")}`, `Related purchase rate: ${combo.customersPurchasingBoth}%`] },
    { id: "product-improvement-mouse", type: "product_improvement", title: "Improve Wireless Mouse product conversion", priority: "High", product: mouse.product, relatedProduct: "", evidence: `${mouse.views.toLocaleString("en-IN")} product views produced ${mouse.purchases.toLocaleString("en-IN")} purchases (${((mouse.purchases / mouse.views) * 100).toFixed(1)}% conversion).`, recommendation: "Test clearer compatibility information and product comparison content on the Wireless Mouse detail page.", expectedImpact: "Improve conversion from existing product traffic.", metrics: [`Product views: ${mouse.views.toLocaleString("en-IN")}`, `Add to cart: ${mouse.addToCart.toLocaleString("en-IN")}`, `Purchases: ${mouse.purchases.toLocaleString("en-IN")}`] },
    { id: "upsell-monitor-arm", type: "upsell", title: "Offer a premium workstation upgrade", priority: "Medium", product: stand.product, relatedProduct: arm.product, evidence: `${arm.views.toLocaleString("en-IN")} visitors viewed Monitor Arm, with ${arm.purchases.toLocaleString("en-IN")} purchases.`, recommendation: "Offer Monitor Arm as a premium workstation upgrade after a Laptop Stand is added to cart.", expectedImpact: "Increase average order value through a higher-value add-on.", metrics: [`Monitor Arm views: ${arm.views.toLocaleString("en-IN")}`, `Purchases: ${arm.purchases.toLocaleString("en-IN")}`, `Revenue: ₹${(arm.revenue / 100000).toFixed(2)}L`] },
    { id: "campaign-workstation", type: "campaign", title: "Create a workstation bundle campaign", priority: "Medium", product: stand.product, relatedProduct: keyboard.product, evidence: `Laptop Stand and Mechanical Keyboard have a ${combo.customersPurchasingBoth}% shared purchase rate.`, recommendation: "Create a limited demo workstation bundle campaign featuring both products.", expectedImpact: "Create a clearer bundled-purchase path for related products.", metrics: [`Combination overlap: ${combo.customersPurchasingBoth}%`, `Laptop Stand purchases: ${stand.purchases.toLocaleString("en-IN")}`, `Keyboard purchases: ${keyboard.purchases.toLocaleString("en-IN")}`] },
  ];
}
