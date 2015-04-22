/// <reference path="../../includes.d.ts" />
declare module DockerRegistry {
    interface DockerImageTag {
        [name: string]: string;
    }
    interface DockerImageRepository {
        name: string;
        description: string;
        tags?: DockerImageTag;
    }
    interface DockerImageRepositories {
        num_results: number;
        query: string;
        results: Array<DockerImageRepository>;
    }
}
