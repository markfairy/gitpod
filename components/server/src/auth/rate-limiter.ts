/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { GitpodServer } from "@gitpod/gitpod-protocol";
import { log } from "@gitpod/gitpod-protocol/lib/util/logging";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";

// export type GitpodServerMethodsType<C extends GitpodClient, S extends GitpodServer> = keyof PublicOnly<GitpodServerImpl<C, S>>
// export type GitpodServerMethodsType = keyof Omit<PublicOnly<GitpodServerImpl<GitpodClient, GitpodServer>>, 'uuid' | "dispose" | "initialize">
// type PublicOnly<T> = Pick<T, keyof T>;
type GitpodServerMethodsType = keyof Omit<GitpodServer, "dispose" | "setClient">;

export interface RateLimiter {
    user: string
    consume(method: string): Promise<RateLimiterRes>
}

export class AnonymRateLimiter implements RateLimiter {
    private static instance_: AnonymRateLimiter;

    public static instance(): RateLimiter {
        if (!AnonymRateLimiter.instance_) {
            AnonymRateLimiter.instance_ = new AnonymRateLimiter();
        }
        return AnonymRateLimiter.instance_;
    }

    public readonly user = "(anonym)";

    private readonly rateLimiter: RateLimiterMemory;

    private constructor() {
        this.rateLimiter = new RateLimiterMemory({
            points: Number(process.env.RATE_LIMITER_ANON_POINTS) || 10,
            duration: Number(process.env.RATE_LIMITER_ANON_DURATION) || 60,
        });
    }

    public async consume(method: string) {
        return this.rateLimiter.consume(method);
    }
}

export class UserRateLimiter implements RateLimiter {

    private static readonly instances = new Map<string, UserRateLimiter>();

    public static instance(user: string): RateLimiter {
        const rateLimiter = UserRateLimiter.instances.get(user) || new UserRateLimiter(user);
        if (!UserRateLimiter.instances.has(user)) {
            // TODO: How to delete instances? on logout?
            UserRateLimiter.instances.set(user, rateLimiter);
        }
        return rateLimiter;
    }

    /**
     * Very costly and critical
     */
    private readonly rateLimiterOne: RateLimiterMemory;

    /**
     * Not very costly but critical
     */
    private readonly rateLimiterTwo: RateLimiterMemory;

    /**
     * Not critical
     */
    private readonly rateLimiterThree: RateLimiterMemory;

    private constructor(public readonly user: string) {
        log.debug(`Create GitpodRateLimiter for user ${user}`);
        this.rateLimiterOne = new RateLimiterMemory({
            keyPrefix: "one",
            points: Number(process.env.RATE_LIMITER_ONE_POINTS) || 5,
            duration: Number(process.env.RATE_LIMITER_ONE_DURATION) || 60,
        });
        this.rateLimiterTwo = new RateLimiterMemory({
            keyPrefix: "two",
            points: Number(process.env.RATE_LIMITER_TWO_POINTS) || 15,
            duration: Number(process.env.RATE_LIMITER_TWO_DURATION) || 60,
        });
        this.rateLimiterThree = new RateLimiterMemory({
            keyPrefix: "three",
            points: Number(process.env.RATE_LIMITER_THREE_POINTS) || 10,
            duration: Number(process.env.RATE_LIMITER_THREE_DURATION) || 60,
        });
    }

    async consume(method: string): Promise<RateLimiterRes> {

        if (this.isGroupOneMethod(method)) {
            return this.rateLimiterOne.consume(this.user);
        }

        if (this.isGroupTwoMethod(method)) {
            return this.rateLimiterTwo.consume(this.user);
        }

        if (this.isGroupThreeMethod(method)) {
            return this.rateLimiterThree.consume(this.user);
        }

        // fallback
        log.warn(`method ${method} is not configured for a rate limiter, using fallback`);
        return this.rateLimiterThree.consume(this.user);
    }

    private isGroupOneMethod(method: string): boolean {
        return this.isGroupType(method, MethodType.One)
    }

    private isGroupTwoMethod(method: string): boolean {
        return this.isGroupType(method, MethodType.Two)
    }

    private isGroupThreeMethod(method: string): boolean {
        return this.isGroupType(method, MethodType.Three)
    }

    private isGroupType(method: string, type: MethodType): boolean {
        return this.methodTypeMapping().get(method) == type
    }

    private methodTypeMapping() {
        return new Map(Object.entries(this.methodTypeMappingObject()));
    }

    private methodTypeMappingObject(): { [K in GitpodServerMethodsType]: MethodType } {
        return {
            "getLoggedInUser": MethodType.One,
            "getTerms": MethodType.One,
            "updateLoggedInUser": MethodType.One,
            "getAuthProviders": MethodType.One,
            "getOwnAuthProviders": MethodType.One,
            "updateOwnAuthProvider": MethodType.One,
            "deleteOwnAuthProvider": MethodType.One,
            "getBranding": MethodType.One,
            "getConfiguration": MethodType.One,
            "getToken": MethodType.One,
            "getPortAuthenticationToken": MethodType.One,
            "deleteAccount": MethodType.One,
            "getClientRegion": MethodType.One,
            "hasPermission": MethodType.One,
            "getWorkspaces": MethodType.One,
            "getWorkspaceOwner": MethodType.One,
            "getWorkspaceUsers": MethodType.One,
            "getFeaturedRepositories": MethodType.One,
            "getWorkspace": MethodType.One,
            "isWorkspaceOwner": MethodType.One,
            "createWorkspace": MethodType.One,
            "startWorkspace": MethodType.One,
            "stopWorkspace": MethodType.One,
            "deleteWorkspace": MethodType.One,
            "setWorkspaceDescription": MethodType.One,
            "controlAdmission": MethodType.One,
            "updateWorkspaceUserPin": MethodType.One,
            "sendHeartBeat": MethodType.One,
            "watchWorkspaceImageBuildLogs": MethodType.One,
            "watchHeadlessWorkspaceLogs": MethodType.One,
            "isPrebuildDone": MethodType.One,
            "setWorkspaceTimeout": MethodType.One,
            "getWorkspaceTimeout": MethodType.One,
            "getOpenPorts": MethodType.One,
            "openPort": MethodType.One,
            "closePort": MethodType.One,
            "getUserMessages": MethodType.One,
            "updateUserMessages": MethodType.One,
            "getUserStorageResource": MethodType.One,
            "updateUserStorageResource": MethodType.One,
            "getEnvVars": MethodType.One,
            "setEnvVar": MethodType.One,
            "deleteEnvVar": MethodType.One,
            "getContentBlobUploadUrl": MethodType.One,
            "getContentBlobDownloadUrl": MethodType.One,
            "getGitpodTokens": MethodType.One,
            "generateNewGitpodToken": MethodType.One,
            "deleteGitpodToken": MethodType.One,
            "sendFeedback": MethodType.One,
            "registerGithubApp": MethodType.One,
            "takeSnapshot": MethodType.One,
            "getSnapshots": MethodType.One,
            "storeLayout": MethodType.One,
            "getLayout": MethodType.One,
            "preparePluginUpload": MethodType.One,
            "resolvePlugins": MethodType.One,
            "installUserPlugins": MethodType.One,
            "uninstallUserPlugin": MethodType.One,

            "adminGetUsers": MethodType.One,
            "adminGetUser": MethodType.One,
            "adminBlockUser": MethodType.One,
            "adminDeleteUser": MethodType.One,
            "adminModifyRoleOrPermission": MethodType.One,
            "adminModifyPermanentWorkspaceFeatureFlag": MethodType.One,
            "adminGetWorkspaces": MethodType.One,
            "adminGetWorkspace": MethodType.One,
            "adminForceStopWorkspace": MethodType.One,
            "adminSetLicense": MethodType.One,

            "validateLicense": MethodType.One,
            "getLicenseInfo": MethodType.One,
            "licenseIncludesFeature": MethodType.One,
        };
    }
}

enum MethodType {
    One,
    Two,
    Three
}
