import { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import '../styles/sidebar.css';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

// IMPORTANT: Layout Management
// 
// This application uses a global Layout component that wraps all pages.
// When creating new pages:
// 1. DO NOT import or use the Layout component in individual page files
// 2. Pages should only return their content without any layout wrapper
// 3. The Layout component handles the header and footer for all pages
//
// See the Management page for an example of the correct structure.

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const path = router.pathname;
  
  // Determine page title based on current path
  let pageTitle = 'The Collection';
  if (path === '/fancy-view') pageTitle = 'Gallery | Starship Collection';
  else if (path === '/statistics') pageTitle = 'Statistics | Starship Collection';
  else if (path === '/price-vault') pageTitle = 'Price Vault | Starship Collection';
  else if (path === '/wishlist') pageTitle = 'Wishlist | Starship Collection';
  else if (path === '/management') pageTitle = 'Management | Starship Collection';
  else if (path === '/setup') pageTitle = 'Setup | Starship Collection';
  else if (path === '/icon-setup') pageTitle = 'Icon Setup | Starship Collection';
  else if (path === '/faction-setup') pageTitle = 'Faction Setup | Starship Collection';
  else if (path === '/edition-setup') pageTitle = 'Edition Setup | Starship Collection';
  else if (path === '/import-export') pageTitle = 'Import/Export | Starship Collection';
  else if (path === '/currency-setup') pageTitle = 'Currency Setup | Starship Collection';
  
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Starship Collection Manager - Track and manage your Star Trek starship collection" />
        <meta name="keywords" content="Star Trek, starships, collection, manager, tracking" />
        <title>{pageTitle}</title>
      </Head>
      <Layout title={pageTitle}>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

export default MyApp;