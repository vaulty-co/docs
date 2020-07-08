module.exports = {
  title: 'Vaulty',
  tagline: 'Encrypt, tokenize, mask your data transparently with Vaulty',
  url: 'https://docs.vaulty.co',
  baseUrl: '/',
  favicon: 'img/favicon.png',
  organizationName: 'Vaulty', // Usually your GitHub org/user name.
  projectName: 'vaulty', // Usually your repo name.
  themeConfig: {
	  sidebarCollapsible: false,
	  disableDarkMode: false,
    navbar: {
      title: 'Vaulty',
      logo: {
        alt: 'Vaulty',
        src: 'img/vaulty-logo.svg',
        href: 'https://vaulty.co/'
      },
      links: [
        { label: 'Documentation', to: '/', position: 'right', activeBaseRegex: '/(intro|quick|reference)' },
        { label: 'Cookbooks', to: '/cookbooks/intro', position: 'right', activeBasePath: '/cookbooks' },
        { label: 'GitHub', href: 'https://github.com/vaulty-co/vaulty', position: 'right' }
      ]
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Vaulty.`
    }
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          homePageId: 'intro',
	  routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/vaulty-co/docs/edit/master/'

        },
        theme: {
          customCss: require.resolve('./src/css/custom.css')
        }
      }
    ]
  ]
}
