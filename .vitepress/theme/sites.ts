export interface SiteInfo {
  key: string
  name: string
  fullName: string
  url: string
}

export const sites: SiteInfo[] = [
  {
    key: 'laravel',
    name: 'Laravel',
    fullName: 'Laravel 中文文档',
    url: 'https://laravel.tangzhangming.com'
  },
  {
    key: 'springboot',
    name: 'Spring Boot',
    fullName: 'Spring Boot 中文文档',
    url: 'https://springboot.tangzhangming.com'
  }
]
