declare module Camel {
    var jmsHeaderSchema: {
        definitions: {
            headers: {
                properties: {
                    JMSCorrelationID: {
                        type: string;
                    };
                    JMSDeliveryMode: {
                        "type": string;
                        "enum": string[];
                    };
                    JMSDestination: {
                        type: string;
                    };
                    JMSExpiration: {
                        type: string;
                    };
                    JMSPriority: {
                        type: string;
                    };
                    JMSReplyTo: {
                        type: string;
                    };
                    JMSType: {
                        type: string;
                    };
                    JMSXGroupId: {
                        type: string;
                    };
                    AMQ_SCHEDULED_CRON: {
                        type: string;
                    };
                    AMQ_SCHEDULED_DELAY: {
                        type: string;
                    };
                    AMQ_SCHEDULED_PERIOD: {
                        type: string;
                    };
                    AMQ_SCHEDULED_REPEAT: {
                        type: string;
                    };
                };
            };
            "javax.jms.Destination": {
                type: string;
            };
        };
    };
}
