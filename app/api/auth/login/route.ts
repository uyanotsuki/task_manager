import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { attachSessionToResponse, verifyPassword } from "@/lib/auth"
import { loginBodySchema, parseJson } from "@/lib/api-schemas"

export async function POST(request: NextRequest) {
  try {
    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 })
    }

    const parsed = parseJson(loginBodySchema, json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
    await attachSessionToResponse(response, user.id)
    return response
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
