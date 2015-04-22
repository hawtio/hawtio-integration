/// <reference path="../../includes.d.ts" />
/// <reference path="osgiHelpers.d.ts" />
/// <reference path="osgiPlugin.d.ts" />
/**
 * @module Osgi
 */
declare module Osgi {
    var configuration: {
        pidMetadata: {
            "io.fabric8.container.java": {
                name: string;
            };
            "io.fabric8.container.process": {
                name: string;
            };
            "io.fabric8.container.process.overlay.resources": {
                name: string;
                description: string;
                schemaExtensions: {
                    disableHumanizeLabel: boolean;
                };
            };
            "io.fabric8.dosgi": {
                name: string;
                description: string;
            };
            "io.fabric8.environment": {
                name: string;
                description: string;
                schemaExtensions: {
                    disableHumanizeLabel: boolean;
                };
            };
            "io.fabric8.fab.osgi.url": {
                name: string;
                description: string;
            };
            "io.fabric8.mq.fabric.server": {
                name: string;
                description: string;
            };
            "io.fabric8.openshift": {
                name: string;
            };
            "io.fabric8.ports": {
                name: string;
                description: string;
                schemaExtensions: {
                    disableHumanizeLabel: boolean;
                };
            };
            "io.fabric8.system": {
                name: string;
                description: string;
                schemaExtensions: {
                    disableHumanizeLabel: boolean;
                };
            };
            "io.fabric8.version": {
                name: string;
                schemaExtensions: {
                    disableHumanizeLabel: boolean;
                };
            };
            "org.ops4j.pax.logging": {
                name: string;
                description: string;
            };
            "org.ops4j.pax.url.mvn": {
                name: string;
                description: string;
            };
            "org.ops4j.pax.url.war": {
                name: string;
                description: string;
            };
            "org.ops4j.pax.url.wrap": {
                name: string;
                description: string;
            };
        };
        ignorePids: string[];
        tabs: {
            "fabric8": {
                label: string;
                description: string;
                pids: string[];
            };
            "karaf": {
                label: string;
                description: string;
                pids: string[];
            };
        };
    };
}
