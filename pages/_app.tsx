import { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import '../styles/sidebar.css';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { CurrencyProvider } from '../contexts/CurrencyContext';

// IMPORTANT: Layout Management
// 
// This application uses a global Layout component that wraps all pages.
// When creating new pages:
// 1. DO NOT import or use the Layout component in individual page files
// 2. Pages should only return their content without any layout wrapper
// 3. The Layout component handles the header and footer for all pages
//
// See the Management page for an example of the correct structure.

// Page title mapping
const PAGE_TITLES: Record<string, string> = {
  '/': 'The Collection',
  '/statistics': 'Statistics | CollectHub',
  '/price-vault': 'Price Vault | CollectHub',
  '/wishlist': 'Wishlist | CollectHub',
  '/management': 'Management | CollectHub',
  '/setup': 'Setup | CollectHub',
  '/icon-setup': 'Icon Setup | CollectHub',
  '/faction-setup': 'Faction Setup | CollectHub',
  '/edition-setup': 'Edition Setup | CollectHub',
  '/franchise-setup': 'Franchise Setup | CollectHub',
  '/manufacturer-setup': 'Manufacturer Setup | CollectHub',
  '/collection-type-setup': 'Collection Type Setup | CollectHub',
  '/import-export': 'Import/Export | CollectHub',
  '/currency-setup': 'Currency Setup | CollectHub',
  '/database-check': 'Database Check | CollectHub',
  '/database-analysis': 'Database Analysis | CollectHub',
  '/manufacturer-assignment': 'Manufacturer Assignment | CollectHub',
  '/other-tools': 'Other Tools | CollectHub',
  '/excel-view': 'Excel View | CollectHub'
};

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const path = router.pathname;
  
  // Determine page title based on current path
  const pageTitle = PAGE_TITLES[path] || 'The Collection';
  
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="CollectHub - Track and manage your collectibles" />
        <meta name="keywords" content="Star Trek, starships, collection, manager, tracking" />
        <title>{pageTitle}</title>
      </Head>
      <CurrencyProvider>
        <Layout title={pageTitle}>
          <Component {...pageProps} />
        </Layout>
      </CurrencyProvider>
    </>
  );
}

export default MyApp;