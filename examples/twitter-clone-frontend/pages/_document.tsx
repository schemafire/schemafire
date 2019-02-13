/* tslint:disable-line:file-name-casing */
import React from 'react';

import Document, { Head, Main, NextDocumentContext, NextScript } from 'next/document';
import { path } from 'ramda';
import { ServerStyleSheet } from 'styled-components';

interface Props {
  styleTags: string;
  locale: string;
  localeDataScript: string;
}

class MyDocument extends Document<Props> {
  public static async getInitialProps(context: NextDocumentContext) {
    const initialProps = await super.getInitialProps(context);

    const sheet = new ServerStyleSheet();
    const page = context.renderPage(App => props => sheet.collectStyles(<App {...props} />));
    const styleTags = sheet.getStyleElement();
    const localeDataScript = path<string>(['req', 'localeDataScript'], context) || '';
    const locale = path<string>(['req', 'locale'], context) || '';
    return { ...initialProps, ...page, styleTags, localeDataScript, locale };
  }

  public render() {
    const { localeDataScript, styleTags } = this.props;

    // Polyfill Intl API for older browsers TODO remove if bundle size too large
    return (
      <html>
        <Head>
          <link rel='manifest' href='/static/manifest.json' />
          {styleTags}
          <link href='https://fonts.googleapis.com/css?family=Rubik:400,500' />
        </Head>
        <body>
          <Main />
          <script
            dangerouslySetInnerHTML={{
              __html: localeDataScript,
            }}
          />
          <NextScript />
          <div id='content' />
        </body>
      </html>
    );
  }
}
export default MyDocument;
