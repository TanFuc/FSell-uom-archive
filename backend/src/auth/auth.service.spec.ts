import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'
import { AuthService } from './auth.service'

jest.mock('bcryptjs')

describe('AuthService', () => {
  let service: AuthService
  let prisma: { user: { findUnique: jest.Mock; update: jest.Mock } }
  let jwtService: { signAsync: jest.Mock }

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    }

    jwtService = {
      signAsync: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'access-secret'
              if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret'
              if (key === 'JWT_ACCESS_EXPIRATION') return '15m'
              if (key === 'JWT_REFRESH_EXPIRATION') return '7d'
              return undefined
            }),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  describe('login', () => {
    it('throws UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.login({ email: 'test@test.com', password: '123' })).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('returns tokens if credentials are valid', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        fullName: 'Test User',
        passwordHash: 'hashed-password',
        role: 'ADMIN',
      })
      prisma.user.update.mockResolvedValue({})
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      jwtService.signAsync.mockResolvedValueOnce('access-token')
      jwtService.signAsync.mockResolvedValueOnce('refresh-token')

      const result = await service.login({ email: 'test@test.com', password: '123' })

      expect(result.accessToken).toBe('access-token')
      expect(result.refreshToken).toBe('refresh-token')
      expect(result.user.email).toBe('test@test.com')
    })
  })
})
