const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting multi-tenant SAAS database seed...');

    // ============================================================================
    // CREATE DEMO ORGANIZATIONS
    // ============================================================================

    console.log('\n📦 Creating organizations...');

    const org1 = await prisma.organization.upsert({
        where: { slug: 'acme-corp' },
        update: {},
        create: {
            name: 'Acme Corporation',
            slug: 'acme-corp',
            settings: {
                timezone: 'America/New_York',
                dateFormat: 'MM/DD/YYYY'
            }
        }
    });
    console.log('✅ Created organization:', org1.name);

    const org2 = await prisma.organization.upsert({
        where: { slug: 'micro mind-labs' },
        update: {},
        create: {
            name: 'MicroMind Labs',
            slug: 'micromind-labs',
            settings: {
                timezone: 'UTC',
                dateFormat: 'YYYY-MM-DD'
            }
        }
    });
    console.log('✅ Created organization:', org2.name);

    // ============================================================================
    // CREATE USERS
    // ============================================================================

    console.log('\n👥 Creating users...');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@acme.com' },
        update: {},
        create: {
            email: 'admin@acme.com',
            passwordHash: adminPassword,
            displayName: 'Admin User',
            role: 'ADMIN',
            active: true,
            currentOrganizationId: org1.id
        }
    });
    console.log('✅ Created admin user:', admin.email);

    const userPassword = await bcrypt.hash('user123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'user@acme.com' },
        update: {},
        create: {
            email: 'user@acme.com',
            passwordHash: userPassword,
            displayName: 'Demo User',
            role: 'USER',
            active: true,
            currentOrganizationId: org1.id
        }
    });
    console.log('✅ Created demo user:', user.email);

    const user2Password = await bcrypt.hash('user123', 10);
    const user2 = await prisma.user.upsert({
        where: { email: 'jane@micromind.com' },
        update: {},
        create: {
            email: 'jane@micromind.com',
            passwordHash: user2Password,
            displayName: 'Jane Smith',
            role: 'USER',
            active: true,
            currentOrganizationId: org2.id
        }
    });
    console.log('✅ Created user:', user2.email);

    // ============================================================================
    // CREATE ORGANIZATION MEMBERSHIPS
    // ============================================================================

    console.log('\n🔗 Creating organization memberships...');

    await prisma.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: org1.id, userId: admin.id } },
        update: {},
        create: {
            organizationId: org1.id,
            userId: admin.id,
            role: 'OWNER'
        }
    });
    console.log('✅ Added admin as OWNER of', org1.name);

    await prisma.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: org1.id, userId: user.id } },
        update: {},
        create: {
            organizationId: org1.id,
            userId: user.id,
            role: 'MEMBER'
        }
    });
    console.log('✅ Added user as MEMBER of', org1.name);

    await prisma.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: org2.id, userId: user2.id } },
        update: {},
        create: {
            organizationId: org2.id,
            userId: user2.id,
            role: 'OWNER'
        }
    });
    console.log('✅ Added Jane as OWNER of', org2.name);

    // ============================================================================
    // CREATE SUBSCRIPTIONS
    // ============================================================================

    console.log('\n💳 Creating subscriptions...');

    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await prisma.subscription.upsert({
        where: { organizationId: org1.id },
        update: {},
        create: {
            organizationId: org1.id,
            plan: 'PRO',
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd
        }
    });
    console.log('✅ Created PRO subscription for', org1.name);

    await prisma.subscription.upsert({
        where: { organizationId: org2.id },
        update: {},
        create: {
            organizationId: org2.id,
            plan: 'FREE',
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd
        }
    });
    console.log('✅ Created FREE subscription for', org2.name);

    // ============================================================================
    // CREATE SAMPLE DATA
    // ============================================================================

    console.log('\n📊 Creating sample data...');

    // Dashboard for Org 1
    await prisma.dashboard.create({
        data: {
            organizationId: org1.id,
            userId: admin.id,
            title: 'System Overview',
            description: 'Main dashboard for Acme Corp',
            sqlQuery: 'SELECT COUNT(*) as total_users FROM users;',
            chartConfig: {
                type: 'bar',
                xAxis: 'category',
                yAxis: 'value'
            },
            isPublic: true
        }
    });
    console.log('✅ Created dashboard for', org1.name);

    // Document for Org 1
    await prisma.document.create({
        data: {
            organizationId: org1.id,
            title: 'Getting Started Guide',
            description: 'Introduction to the platform',
            fileType: 'PDF',
            s3Path: '/demo/getting-started.pdf',
            size: 1024000,
            uploadedBy: admin.id,
            tags: ['guide', 'tutorial'],
            metadata: { category: 'documentation' }
        }
    });
    console.log('✅ Created document for', org1.name);

    // Dashboard for Org 2
    await prisma.dashboard.create({
        data: {
            organizationId: org2.id,
            userId: user2.id,
            title: 'Team Analytics',
            description: 'Analytics for MicroMind Labs',
            sqlQuery: 'SELECT * FROM dashboards LIMIT 10;',
            isPublic: false
        }
    });
    console.log('✅ Created dashboard for', org2.name);

    // ============================================================================
    // SEED SHADOWMATE EDTECH DATA
    // ============================================================================

    console.log('\n🎓 Seeding ShadowMate academic tracks & student profile...');

    const track1 = await prisma.academicTrack.upsert({
        where: { code: 'AI_ML' },
        update: {},
        create: {
            organizationId: org1.id,
            trackName: 'Artificial Intelligence & Machine Learning',
            code: 'AI_ML',
            description: 'Master neural networks, deep learning, Python, and agentic AI workflows.',
            icon: 'Brain',
            requiredSkills: ['Problem Solving', 'Python', 'Logical Thinking', 'Math'],
            careerOutcomes: ['AI Engineer', 'ML Researcher', 'Data Scientist']
        }
    });

    const track2 = await prisma.academicTrack.upsert({
        where: { code: 'SE_FULLSTACK' },
        update: {},
        create: {
            organizationId: org1.id,
            trackName: 'Full-Stack Software Engineering',
            code: 'SE_FULLSTACK',
            description: 'Build modern scalable web systems, databases, and microservices.',
            icon: 'Code2',
            requiredSkills: ['Logical Thinking', 'JavaScript', 'Problem Solving', 'Web Development'],
            careerOutcomes: ['Full Stack Developer', 'Software Architect', 'Frontend Lead']
        }
    });

    console.log('✅ Seeded Academic Tracks:', track1.trackName, ',', track2.trackName);

    // Initial student learning profile for demo user
    await prisma.studentLearningProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            organizationId: org1.id,
            avgActualVsEstRatio: 0.85, // finishes 15% faster
            preferredStudyHours: { morning: 20, afternoon: 30, evening: 50 },
            preferredSessionDuration: 45,
            dailyStudyCapacityMinutes: 180,
            skills: ['Problem Solving', 'Python', 'Logical Thinking'],
            interests: ['Artificial Intelligence', 'Software Development'],
            focusPattern: { peakFocusHour: 16, avgFocusScore: 4.2 },
            dataConfidenceScore: 0.6
        }
    });

    console.log('✅ Seeded Student Learning Profile for', user.email);

    console.log('');
    console.log('🎉 Multi-tenant SAAS database seeded successfully!');
    console.log('');
    console.log('📝 Demo Credentials:');
    console.log('');
    console.log('   Organization 1: Acme Corporation (PRO plan)');
    console.log('   - Owner:   admin@acme.com / admin123');
    console.log('   - Member:  user@acme.com / user123');
    console.log('');
    console.log('   Organization 2: MicroMind Labs (FREE plan)');
    console.log('   - Owner:   jane@micromind.com / user123');
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
