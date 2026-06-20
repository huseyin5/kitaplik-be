import { env } from './env';

/**
 * Elle yazılmış OpenAPI 3.0 spesifikasyonu. Swagger UI (`/docs`) bunu
 * kullanarak interaktif test arayüzü sunar. Şemalar, koddaki Zod
 * şemaları ve normalize tiplerle uyumlu tutulmalıdır.
 */
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Kitaplık Backend API',
    version: '1.0.0',
    description:
      'Kişisel sanal kitap kütüphanesi. Kitap arama (Google Books birincil, ' +
      'Open Library yedek) ve kullanıcının kütüphanesi (CRUD) uçları.',
  },
  servers: [{ url: `http://localhost:${env.PORT}`, description: 'Yerel geliştirme' }],
  tags: [
    { name: 'Health', description: 'Sağlık kontrolü' },
    { name: 'Auth', description: 'Kullanıcı kaydı ve girişi' },
    { name: 'Books', description: 'Dış API ile kitap arama ve detay' },
    { name: 'Library', description: 'Kullanıcının kütüphanesi (CRUD) — kimlik doğrulaması gerekir' },
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Kayıt ol',
        description: 'Yeni kullanıcı oluşturur ve oturum token\'ı döner. Kullanıcı adı benzersiz olmalıdır.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Credentials' } },
          },
        },
        responses: {
          '201': {
            description: 'Oluşturulan oturum',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResult' } } },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '409': {
            description: 'Kullanıcı adı zaten alınmış',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Giriş yap',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Credentials' } },
          },
        },
        responses: {
          '200': {
            description: 'Oturum',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResult' } } },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Sağlık kontrolü',
        responses: {
          '200': {
            description: 'Çalışıyor',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/books/search': {
      get: {
        tags: ['Books'],
        summary: 'Kitap ara',
        description:
          'Google Books\'ta arar; sonuç yoksa veya servis hata verirse Open Library\'ye düşer.',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string', minLength: 1, maxLength: 200 },
            example: 'tutunamayanlar',
            description: 'Arama terimi',
          },
          {
            name: 'by',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['title', 'author'] },
            description: 'Başlık veya yazar bazlı arama (boşsa genel arama)',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 40, default: 20 },
            description: 'Sonuç sayısı',
          },
        ],
        responses: {
          '200': {
            description: 'Arama sonuçları',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer', example: 3 },
                    results: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/NormalizedBook' },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '502': { $ref: '#/components/responses/BadGateway' },
        },
      },
    },
    '/api/books/{source}/{id}': {
      get: {
        tags: ['Books'],
        summary: 'Tekil kitap detayı',
        parameters: [
          {
            name: 'source',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['google', 'openlibrary'] },
          },
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Kaynağa özel kitap id (arama sonucundaki "id" alanı)',
          },
        ],
        responses: {
          '200': {
            description: 'Kitap detayı',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NormalizedBook' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '502': { $ref: '#/components/responses/BadGateway' },
        },
      },
    },
    '/api/library': {
      get: {
        tags: ['Library'],
        summary: 'Kütüphaneyi listele',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { $ref: '#/components/schemas/ReadingStatus' },
            description: 'Okuma durumuna göre filtre',
          },
        ],
        responses: {
          '200': {
            description: 'Kitap listesi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer', example: 1 },
                    books: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/LibraryBook' },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
      post: {
        tags: ['Library'],
        summary: 'Kütüphaneye kitap ekle',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddLibraryBook' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Eklenen kitap',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LibraryBook' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/library/{id}': {
      patch: {
        tags: ['Library'],
        summary: 'Okuma durumunu güncelle',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { $ref: '#/components/schemas/ReadingStatus' } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Güncellenen kitap',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LibraryBook' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Library'],
        summary: 'Kütüphaneden sil',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '204': { description: 'Silindi (gövde yok)' },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
  components: {
    schemas: {
      ReadingStatus: {
        type: 'string',
        enum: ['okunacak', 'okunuyor', 'okundu'],
        example: 'okunacak',
      },
      NormalizedBook: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'lTxaEAAAQBAJ' },
          source: { type: 'string', enum: ['google', 'openlibrary'] },
          title: { type: 'string', example: 'Tutunamayanlar' },
          authors: { type: 'array', items: { type: 'string' }, example: ['Oğuz Atay'] },
          isbn: { type: 'string', nullable: true, example: '9789750525728' },
          coverUrl: { type: 'string', nullable: true },
          publisher: { type: 'string', nullable: true, example: 'İletişim Yayınları' },
          publishedDate: { type: 'string', nullable: true, example: '1972' },
          description: { type: 'string', nullable: true },
          pageCount: { type: 'integer', nullable: true, example: 724 },
        },
      },
      AddLibraryBook: {
        type: 'object',
        required: ['title', 'source'],
        properties: {
          title: { type: 'string', example: 'Tutunamayanlar' },
          authors: { type: 'array', items: { type: 'string' }, example: ['Oğuz Atay'] },
          isbn: { type: 'string', nullable: true, example: '9789750525728' },
          coverUrl: { type: 'string', nullable: true },
          publisher: { type: 'string', nullable: true, example: 'İletişim Yayınları' },
          publishedDate: { type: 'string', nullable: true, example: '1972' },
          description: { type: 'string', nullable: true },
          pageCount: { type: 'integer', nullable: true, example: 724 },
          source: { type: 'string', enum: ['google', 'openlibrary'], example: 'google' },
          status: { $ref: '#/components/schemas/ReadingStatus' },
        },
      },
      LibraryBook: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid', nullable: true },
          title: { type: 'string' },
          authors: { type: 'array', items: { type: 'string' } },
          isbn: { type: 'string', nullable: true },
          coverUrl: { type: 'string', nullable: true },
          publisher: { type: 'string', nullable: true },
          publishedDate: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          pageCount: { type: 'integer', nullable: true },
          source: { type: 'string' },
          status: { $ref: '#/components/schemas/ReadingStatus' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Credentials: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 30,
            pattern: '^[a-zA-Z0-9_]+$',
            example: 'ali_veli',
          },
          password: { type: 'string', minLength: 6, example: 'gizli123' },
        },
      },
      AuthResult: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'Bearer access token' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              username: { type: 'string', example: 'ali_veli' },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          details: {},
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Giriş/kayıt sonrası dönen token: `Authorization: Bearer <token>`',
      },
    },
    responses: {
      BadRequest: {
        description: 'Geçersiz istek / validasyon hatası',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Unauthorized: {
        description: 'Kimlik doğrulaması gerekli veya geçersiz',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Kaynak bulunamadı',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      BadGateway: {
        description: 'Dış servis hatası',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
} as const;
