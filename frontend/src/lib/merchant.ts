import archiveSummary from "@/data/merchant-events-summary.json";

export type MerchantProduct = { product: string; productId: string; brand: string; category: string; views: number; detailViews: number; addToCart: number; purchases: number; revenue: number };
export type ProductCombination = { product: string; relatedProduct: string; customersPurchasingBoth: number };
export type MerchantData = { products: MerchantProduct[]; combinations: ProductCombination[]; currency: string; source: string; events: number };
export type MerchantOpportunity = { id: string; type: "upsell" | "cross_sell" | "product_improvement" | "campaign"; title: string; priority: "High" | "Medium" | "Low"; product: string; relatedProduct: string; evidence: string; recommendation: string; expectedImpact: string; metrics: string[] };

function titleCase(value: string) { return value.split(".").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" / "); }
function productName(product: { brand: string; category: string; productId: string }) { return `${product.brand === "Unbranded" ? "Unbranded" : titleCase(product.brand)} ${titleCase(product.category)} · #${product.productId}`; }

export const merchantData: MerchantData = {
  currency: archiveSummary.currency,
  source: archiveSummary.source,
  events: archiveSummary.totals.events,
  combinations: [],
  products: archiveSummary.products.map((product) => ({ product: productName(product), productId: product.productId, brand: product.brand, category: product.category, views: product.views, detailViews: product.views, addToCart: product.addToCart, purchases: product.purchases, revenue: product.revenue })),
};

export function merchantTotals(data: MerchantData) {
  const revenue = archiveSummary.totals.revenue;
  const orders = archiveSummary.totals.purchases;
  const views = archiveSummary.totals.views;
  return { revenue, orders, views, averageOrderValue: Math.round(revenue / orders), conversionRate: Number(((orders / views) * 100).toFixed(2)) };
}

function percentage(numerator: number, denominator: number) { return denominator ? ((numerator / denominator) * 100).toFixed(2) : "0.00"; }
function usd(value: number) { return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`; }

export function deriveMerchantGrowth(data: MerchantData): MerchantOpportunity[] {
  const rankedByRevenue = [...data.products].sort((left, right) => right.revenue - left.revenue);
  const rankedByViews = [...data.products].sort((left, right) => right.views - left.views);
  const rankedByAbandonment = [...data.products].sort((left, right) => (right.addToCart - right.purchases) - (left.addToCart - left.purchases));
  const topRevenue = rankedByRevenue[0];
  const topTraffic = rankedByViews[0] ?? topRevenue;
  const topAbandonment = rankedByAbandonment[0] ?? topRevenue;
  const secondRevenue = rankedByRevenue[1] ?? topRevenue;
  if (!topRevenue || !topTraffic || !topAbandonment || !secondRevenue) return [];

  return [
    { id: `conversion-${topTraffic.productId}`, type: "product_improvement", title: `Improve conversion for ${topTraffic.product}`, priority: "High", product: topTraffic.product, relatedProduct: "", evidence: `${topTraffic.views.toLocaleString("en-US")} recorded views resulted in ${topTraffic.purchases.toLocaleString("en-US")} purchases (${percentage(topTraffic.purchases, topTraffic.views)}% conversion).`, recommendation: "Review the product detail page, availability messaging, and checkout path for this high-traffic product.", expectedImpact: "Improve conversion from an existing, high-volume traffic source.", metrics: [`Views: ${topTraffic.views.toLocaleString("en-US")}`, `Add to cart: ${topTraffic.addToCart.toLocaleString("en-US")}`, `Purchases: ${topTraffic.purchases.toLocaleString("en-US")}`] },
    { id: `cart-recovery-${topAbandonment.productId}`, type: "campaign", title: `Recover cart intent for ${topAbandonment.product}`, priority: "High", product: topAbandonment.product, relatedProduct: "", evidence: `${topAbandonment.addToCart.toLocaleString("en-US")} cart events and ${topAbandonment.purchases.toLocaleString("en-US")} purchases leave ${(topAbandonment.addToCart - topAbandonment.purchases).toLocaleString("en-US")} recorded cart-to-purchase gaps.`, recommendation: "Test a cart recovery message and remove checkout friction for visitors who added this product to cart.", expectedImpact: "Convert more already-expressed purchase intent without adding new acquisition spend.", metrics: [`Cart events: ${topAbandonment.addToCart.toLocaleString("en-US")}`, `Purchases: ${topAbandonment.purchases.toLocaleString("en-US")}`, `Cart-to-purchase rate: ${percentage(topAbandonment.purchases, topAbandonment.addToCart)}%`] },
    { id: `revenue-campaign-${topRevenue.productId}`, type: "campaign", title: `Scale the proven revenue path for ${topRevenue.product}`, priority: "Medium", product: topRevenue.product, relatedProduct: "", evidence: `${topRevenue.purchases.toLocaleString("en-US")} purchases generated ${usd(topRevenue.revenue)} in recorded purchase revenue.`, recommendation: "Use this product as a priority campaign landing destination while monitoring conversion and cart completion.", expectedImpact: "Focus promotional effort on a product with demonstrated purchase revenue.", metrics: [`Recorded revenue: ${usd(topRevenue.revenue)}`, `Purchases: ${topRevenue.purchases.toLocaleString("en-US")}`, `Views: ${topRevenue.views.toLocaleString("en-US")}`] },
    { id: `portfolio-${secondRevenue.productId}`, type: "product_improvement", title: "Protect the next highest-revenue product path", priority: "Medium", product: secondRevenue.product, relatedProduct: "", evidence: `${secondRevenue.purchases.toLocaleString("en-US")} purchases generated ${usd(secondRevenue.revenue)} in recorded purchase revenue.`, recommendation: "Monitor inventory, product-page quality, and checkout completion for this high-value product path.", expectedImpact: "Maintain revenue concentration while validating whether its conversion path can be expanded.", metrics: [`Recorded revenue: ${usd(secondRevenue.revenue)}`, `Cart events: ${secondRevenue.addToCart.toLocaleString("en-US")}`, `Conversion: ${percentage(secondRevenue.purchases, secondRevenue.views)}%`] },
  ];
}
