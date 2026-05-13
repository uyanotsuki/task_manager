import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { attachSessionToResponse, hashPassword } from "@/lib/auth"
import { parseJson, registerBodySchema } from "@/lib/api-schemas"

export async function POST(request: NextRequest) {
  try {
    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 })
    }

    const parsed = parseJson(registerBodySchema, json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { email, password, name } = parsed.data
    const emailNormalized = email.toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Такой пользователь уже есть" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email: emailNormalized,
        password: hashedPassword,
        name,
      },
    })

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 },
    )
    await attachSessionToResponse(response, user.id)
    return response
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
