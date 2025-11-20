import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import RelayPlugin from '@pothos/plugin-relay';
import { prisma } from './db';
import type PrismaTypes from '@pothos/plugin-prisma/generated';

const builder = new SchemaBuilder<{
    PrismaTypes: PrismaTypes;
    Scalars: {
        DateTime: {
            Input: Date;
            Output: Date;
        };
    };
}>({
    plugins: [PrismaPlugin, RelayPlugin],
    prisma: { client: prisma },
    relay: {
        clientMutationId: 'omit',
        cursorType: 'String',
    },
});

builder.scalarType('DateTime', {
    serialize: (value) => value.toISOString(),
    parseValue: (value) => new Date(value as string),
});

builder.prismaObject('Company', {
    fields: (t: any) => ({
        id: t.exposeID('id'),
        name: t.exposeString('name'),
        logo: t.exposeString('logo', { nullable: true }),
        jobs: t.relation('jobs'),
    }),
});
builder.prismaObject('Job', {
    fields: (t: any) => ({
        id: t.exposeID('id'),
        title: t.exposeString('title'),
        description: t.exposeString('description'),
        salary: t.exposeInt('salary', { nullable: true }),
        location: t.exposeString('location'),
        type: t.exposeString('type'),
        company: t.relation('company'),
        createdAt: t.expose('createdAt', { type: 'DateTime' }),
    }),
});

builder.prismaObject('Application', {
    fields: (t: any) => ({
        id: t.exposeID('id'),
        job: t.relation('job'),
        jobId: t.exposeID('jobId'),
        name: t.exposeString('name'),
        email: t.exposeString('email'),
        resume: t.exposeString('resume'),
        coverLetter: t.exposeString('coverLetter', { nullable: true }),
        createdAt: t.expose('createdAt', { type: 'DateTime' }),
    }),
});

builder.queryType({
    fields: (t) => ({
        jobs: t.prismaField({
            type: ['Job'],
            resolve: (query) => prisma.job.findMany({ ...query }),
        }),
        job: t.prismaField({
            type: 'Job',
            args: { id: t.arg.id({ required: true }) },
            resolve: (query, _, { id }) => prisma.job.findUnique({ ...query, where: { id } }),
        }),
        companies: t.prismaField({
            type: ['Company'],
            resolve: (query) => prisma.company.findMany({ ...query }),
        }),
    }),
});

builder.mutationType({
    fields: (t) => ({
        createJob: t.prismaField({
            type: 'Job',
            args: {
                title: t.arg.string({ required: true }),
                description: t.arg.string({ required: true }),
                companyId: t.arg.id({ required: true }),
                location: t.arg.string({ required: true }),
                type: t.arg.string({ required: true }),
                salary: t.arg.int(),
            },
            resolve: (query, _, args) => prisma.job.create({
                ...query,
                data: {
                    title: args.title,
                    description: args.description,
                    companyId: args.companyId,
                    location: args.location,
                    type: args.type,
                    ...(args.salary !== undefined ? { salary: args.salary } : {}),
                },
            }),
        }),
        applyToJob: t.prismaField({
            type: 'Application',
            args: {
                jobId: t.arg.id({ required: true }),
                name: t.arg.string({ required: true }),
                email: t.arg.string({ required: true }),
                resume: t.arg.string({ required: true }),
                coverLetter: t.arg.string(),
            },
            resolve: (query, _, args) => prisma.application.create({
                ...query,
                data: {
                    jobId: args.jobId,
                    name: args.name,
                    email: args.email,
                    resume: args.resume,
                    ...(args.coverLetter !== undefined ? { coverLetter: args.coverLetter } : {}),
                },
            }),
        }),
        createCompany: t.prismaField({
            type: 'Company',
            args: {
                name: t.arg.string({ required: true }),
                logo: t.arg.string(),
                website: t.arg.string(),
            },
            resolve: (query, _, args) => prisma.company.create({
                ...query,
                data: {
                    name: args.name,
                    ...(args.logo && { logo: args.logo }),
                    ...(args.website && { website: args.website }),
                },
            }),
        }),
    }),
});

export const schema = builder.toSchema();