import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Role } from '@prisma/client'
import { Request } from 'express'

export interface JwtPayload {
  sub: string
  email: string
  role: Role
  userId?: string
}

type RequestWithUser = Request & {
  user?: JwtPayload
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>()
    const user = request.user

    if (!user) {
      return undefined
    }

    if (data) {
      return user[data]
    }

    return user
  },
)
