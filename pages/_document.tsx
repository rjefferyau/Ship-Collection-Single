import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          {/* Google Fonts - Inter */}
          <link 
            rel="preconnect" 
            href="https://fonts.googleapis.com" 
          />
          <link 
            rel="preconnect" 
            href="https://fonts.gstatic.com" 
            crossOrigin="anonymous" 
          />
          <link 
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
            rel="stylesheet" 
          />
          
          {/* Font Awesome */}
          <link 
            rel="stylesheet" 
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
            integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
            crossOrigin="anonymous" 
            referrerPolicy="no-referrer" 
          />
          
          {/* DataTables CSS */}
          <link rel="stylesheet" href="https://cdn.datatables.net/1.11.5/css/dataTables.tailwindcss.min.css" />
        </Head>
        <body>
          <Main />
          <NextScript />
          
        </body>
      </Html>
    );
  }
}

export default MyDocument; 