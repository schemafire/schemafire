/* tslint:disable-line:file-name-casing */
import React from 'react';

import Document, { Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  public render() {
    return (
      <html>
        <Head>
          <link rel='manifest' href='/static/manifest.json' />
          <link href='https://fonts.googleapis.com/css?family=Rubik:400,500' />
          <link
            href='https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.4.1/semantic.min.css'
            rel='stylesheet'
            type='text/css'
          />
        </Head>
        <body>
          <Main />
          <NextScript />
          <div id='content' />
        </body>
      </html>
    );
  }
}
export default MyDocument;
