import { ReplitConnectors } from '@replit/connectors-sdk';
import { createClient } from '@replit/revenuecat-sdk/client';
import { getProductStoreState, getProductsFromPackage, listOfferings, listPackages } from '@replit/revenuecat-sdk';

// Read-only catalog diagnostic; credentials remain inside the connector proxy.
function getUncachableRevenueCatClient() {
  const connectors = new ReplitConnectors();
  return createClient({
    baseUrl: 'https://api.revenuecat.com/v2',
    fetch: connectors.createProxyFetch('revenuecat'),
  });
}

async function main() {
  const project_id = process.env.REVENUECAT_PROJECT_ID;
  const app_id = process.env.REVENUECAT_APPLE_APP_STORE_APP_ID;
  if (!project_id || !app_id) throw new Error('RevenueCat project and Apple app IDs are required.');
  const call = () => ({ client: getUncachableRevenueCatClient(), throwOnError: true as const });
  const { data: offerings } = await listOfferings({ ...call(), path: { project_id } });
  if (offerings.next_page) throw new Error('Offering pagination required; check would be incomplete.');
  const current = offerings.items.find(offering => offering.is_current);
  if (!current) throw new Error('No current offering is configured.');
  console.log('Current offering:', current.lookup_key);
  const { data: packages } = await listPackages({
    ...call(), path: { project_id, offering_id: current.id },
  });
  if (packages.next_page) throw new Error('Package pagination required; check would be incomplete.');
  for (const pkg of packages.items) {
    const { data: products } = await getProductsFromPackage({
      ...call(), path: { project_id, package_id: pkg.id },
    });
    if (products.next_page) throw new Error('Product pagination required; check would be incomplete.');
    const apple = products.items.filter(item => item.product.app_id === app_id);
    if (!apple.length) console.log(pkg.lookup_key, 'No Apple product attached.');
    for (const { product } of apple) {
      const { data: state } = await getProductStoreState({
        ...call(), path: { project_id, product_id: product.id },
      });
      console.log(JSON.stringify({
        package: pkg.lookup_key,
        product: product.store_identifier,
        catalogState: product.state,
        appleStatus: state.store_status,
      }));
    }
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });