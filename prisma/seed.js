import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Seed users
  await prisma.user.createMany({
    data: [
      {
        id: 'user001',
        accountId: 'acc001',
        username: 'testuser1',
        firstName: 'Test',
        lastName: 'UserOne',
        gender: 'MALE',
        bio: 'Sample bio 1',
        location: 'Earth',
        avatarUrl: null,
      },
      {
        id: 'user002',
        accountId: 'acc002',
        username: 'testuser2',
        firstName: 'Alice',
        lastName: 'Smith',
        gender: 'FEMALE',
        bio: 'Sample bio 2',
        location: 'Mars',
        avatarUrl: null,
      },
      {
        id: 'user003',
        accountId: 'acc003',
        username: 'testuser3',
        firstName: 'Bob',
        lastName: 'Johnson',
        gender: 'MALE',
        bio: 'Sample bio 3',
        location: 'Venus',
        avatarUrl: null,
      },
      {
        id: 'user004',
        accountId: 'acc004',
        username: 'testuser4',
        firstName: 'Carol',
        lastName: 'Williams',
        gender: 'FEMALE',
        bio: 'Sample bio 4',
        location: 'Jupiter',
        avatarUrl: null,
      },
      {
        id: 'user005',
        accountId: 'acc005',
        username: 'testuser5',
        firstName: 'Dave',
        lastName: 'Brown',
        gender: 'MALE',
        bio: 'Sample bio 5',
        location: 'Saturn',
        avatarUrl: null,
      },
      {
        id: 'useradmin',
        accountId: 'accadmin',
        username: 'adminuser',
        firstName: 'blaine',
        lastName: 'nguyen',
        gender: 'MALE',
        bio: 'admin bio',
        location: 'somewhere in 2017',
        avatarUrl: null,
      },
    ],
    skipDuplicates: true,
  })

  // Seed user preferences
  await prisma.userPreferences.createMany({
    data: [
      {
        userId: 'user001',
        theme: 'light',
        language: 'en',
        extras: { notifications: true },
      },
      {
        userId: 'user002',
        theme: 'dark',
        language: 'vi',
        extras: { notifications: false },
      },
      {
        userId: 'user003',
        theme: 'light',
        language: 'en',
        extras: { notifications: true },
      },
      {
        userId: 'user004',
        theme: 'dark',
        language: 'en',
        extras: { notifications: true },
      },
      {
        userId: 'user005',
        theme: 'light',
        language: 'fr',
        extras: { notifications: false },
      },
      {
        userId: 'useradmin',
        theme: 'dark',
        language: 'en',
        extras: { notifications: true, admin: true },
      },
    ],
    skipDuplicates: true,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
