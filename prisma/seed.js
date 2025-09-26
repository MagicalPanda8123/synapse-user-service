import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Seed users (10 normal users + 1 admin)
  await prisma.user.createMany({
    data: [
      {
        id: 'user001',
        accountId: 'acc001',
        username: 'testuser1',
        firstName: 'Ray',
        lastName: 'Quan',
        gender: 'MALE',
        bio: 'Sample bio 1',
        location: 'Earth',
        avatarKey: null
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
        avatarKey: null
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
        avatarKey: null
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
        avatarKey: null,
        isPrivate: true // Private account
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
        avatarKey: null
      },
      {
        id: 'user006',
        accountId: 'acc006',
        username: 'testuser6',
        firstName: 'Emma',
        lastName: 'Davis',
        gender: 'FEMALE',
        bio: 'Love photography and travel',
        location: 'Neptune',
        avatarKey: null
      },
      {
        id: 'user007',
        accountId: 'acc007',
        username: 'testuser7',
        firstName: 'Frank',
        lastName: 'Miller',
        gender: 'MALE',
        bio: 'Software developer',
        location: 'Pluto',
        avatarKey: null,
        isPrivate: true // Private account
      },
      {
        id: 'user008',
        accountId: 'acc008',
        username: 'testuser8',
        firstName: 'Grace',
        lastName: 'Wilson',
        gender: 'FEMALE',
        bio: 'Art enthusiast',
        location: 'Mercury',
        avatarKey: null
      },
      {
        id: 'user009',
        accountId: 'acc009',
        username: 'testuser9',
        firstName: 'Henry',
        lastName: 'Taylor',
        gender: 'MALE',
        bio: 'Music lover',
        location: 'Uranus',
        avatarKey: null
      },
      {
        id: 'user010',
        accountId: 'acc010',
        username: 'testuser10',
        firstName: 'Ivy',
        lastName: 'Anderson',
        gender: 'FEMALE',
        bio: 'Fitness coach',
        location: 'Sun',
        avatarKey: null
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
        avatarKey: null
      }
    ],
    skipDuplicates: true
  })

  // Seed user preferences
  await prisma.userPreferences.createMany({
    data: [
      {
        userId: 'user001',
        theme: 'light',
        language: 'en',
        extras: { notifications: true }
      },
      {
        userId: 'user002',
        theme: 'dark',
        language: 'vi',
        extras: { notifications: false }
      },
      {
        userId: 'user003',
        theme: 'light',
        language: 'en',
        extras: { notifications: true }
      },
      {
        userId: 'user004',
        theme: 'dark',
        language: 'en',
        extras: { notifications: true }
      },
      {
        userId: 'user005',
        theme: 'light',
        language: 'fr',
        extras: { notifications: false }
      },
      {
        userId: 'user006',
        theme: 'light',
        language: 'en',
        extras: { notifications: true }
      },
      {
        userId: 'user007',
        theme: 'dark',
        language: 'en',
        extras: { notifications: false }
      },
      {
        userId: 'user008',
        theme: 'light',
        language: 'es',
        extras: { notifications: true }
      },
      {
        userId: 'user009',
        theme: 'dark',
        language: 'en',
        extras: { notifications: true }
      },
      {
        userId: 'user010',
        theme: 'light',
        language: 'en',
        extras: { notifications: false }
      },
      {
        userId: 'useradmin',
        theme: 'dark',
        language: 'en',
        extras: { notifications: true, admin: true }
      }
    ],
    skipDuplicates: true
  })

  // Seed follow relationships
  await prisma.follow.createMany({
    data: [
      // Accepted follows (public accounts)
      { followerId: 'user001', followingId: 'user002', status: 'ACCEPTED' },
      { followerId: 'user001', followingId: 'user003', status: 'ACCEPTED' },
      { followerId: 'user001', followingId: 'user005', status: 'ACCEPTED' },
      { followerId: 'user002', followingId: 'user001', status: 'ACCEPTED' },
      { followerId: 'user002', followingId: 'user006', status: 'ACCEPTED' },
      { followerId: 'user003', followingId: 'user001', status: 'ACCEPTED' },
      { followerId: 'user003', followingId: 'user008', status: 'ACCEPTED' },
      { followerId: 'user005', followingId: 'user002', status: 'ACCEPTED' },
      { followerId: 'user005', followingId: 'user009', status: 'ACCEPTED' },
      { followerId: 'user006', followingId: 'user010', status: 'ACCEPTED' },
      { followerId: 'user008', followingId: 'user009', status: 'ACCEPTED' },
      { followerId: 'user009', followingId: 'user010', status: 'ACCEPTED' },
      { followerId: 'user010', followingId: 'user001', status: 'ACCEPTED' },

      // Pending requests (to private accounts)
      { followerId: 'user001', followingId: 'user004', status: 'PENDING' }, // user001 -> user004 (private)
      { followerId: 'user002', followingId: 'user007', status: 'PENDING' }, // user002 -> user007 (private)
      { followerId: 'user005', followingId: 'user004', status: 'PENDING' }, // user005 -> user004 (private)
      { followerId: 'user006', followingId: 'user007', status: 'PENDING' }, // user006 -> user007 (private)

      // Some accepted follows involving private accounts (already accepted before they went private)
      { followerId: 'user004', followingId: 'user001', status: 'ACCEPTED' }, // private user004 -> user001
      { followerId: 'user007', followingId: 'user003', status: 'ACCEPTED' }, // private user007 -> user003

      // Admin follows some users
      { followerId: 'useradmin', followingId: 'user001', status: 'ACCEPTED' },
      { followerId: 'useradmin', followingId: 'user002', status: 'ACCEPTED' },
      { followerId: 'useradmin', followingId: 'user003', status: 'ACCEPTED' }
    ],
    skipDuplicates: true
  })

  console.log('✅ Seed data created successfully!')
  console.log('👥 Users: 11 (10 normal + 1 admin)')
  console.log('🔒 Private accounts: user004, user007')
  console.log('✅ Accepted follows: Various mutual relationships')
  console.log('⏳ Pending requests: 4 requests to private accounts')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
