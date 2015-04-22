declare module Camel {
    var camelHeaderSchema: {
        definitions: {
            headers: {
                properties: {
                    "CamelAuthentication": {
                        type: string;
                    };
                    "CamelAuthenticationFailurePolicyId": {
                        type: string;
                    };
                    "CamelAcceptContentType": {
                        type: string;
                    };
                    "CamelAggregatedSize": {
                        type: string;
                    };
                    "CamelAggregatedTimeout": {
                        type: string;
                    };
                    "CamelAggregatedCompletedBy": {
                        type: string;
                    };
                    "CamelAggregatedCorrelationKey": {
                        type: string;
                    };
                    "CamelAggregationStrategy": {
                        type: string;
                    };
                    "CamelAggregationCompleteAllGroups": {
                        type: string;
                    };
                    "CamelAggregationCompleteAllGroupsInclusive": {
                        type: string;
                    };
                    "CamelAsyncWait": {
                        type: string;
                    };
                    "CamelBatchIndex": {
                        type: string;
                    };
                    "CamelBatchSize": {
                        type: string;
                    };
                    "CamelBatchComplete": {
                        type: string;
                    };
                    "CamelBeanMethodName": {
                        type: string;
                    };
                    "CamelBeanMultiParameterArray": {
                        type: string;
                    };
                    "CamelBinding": {
                        type: string;
                    };
                    "breadcrumbId": {
                        type: string;
                    };
                    "CamelCharsetName": {
                        type: string;
                    };
                    "CamelCreatedTimestamp": {
                        type: string;
                    };
                    "Content-Encoding": {
                        type: string;
                    };
                    "Content-Length": {
                        type: string;
                    };
                    "Content-Type": {
                        type: string;
                    };
                    "CamelCorrelationId": {
                        type: string;
                    };
                    "CamelDataSetIndex": {
                        type: string;
                    };
                    "org.apache.camel.default.charset": {
                        type: string;
                    };
                    "CamelDestinationOverrideUrl": {
                        type: string;
                    };
                    "CamelDisableHttpStreamCache": {
                        type: string;
                    };
                    "CamelDuplicateMessage": {
                        type: string;
                    };
                    "CamelExceptionCaught": {
                        type: string;
                    };
                    "CamelExceptionHandled": {
                        type: string;
                    };
                    "CamelEvaluateExpressionResult": {
                        type: string;
                    };
                    "CamelErrorHandlerHandled": {
                        type: string;
                    };
                    "CamelExternalRedelivered": {
                        type: string;
                    };
                    "CamelFailureHandled": {
                        type: string;
                    };
                    "CamelFailureEndpoint": {
                        type: string;
                    };
                    "CamelFailureRouteId": {
                        type: string;
                    };
                    "CamelFilterNonXmlChars": {
                        type: string;
                    };
                    "CamelFileLocalWorkPath": {
                        type: string;
                    };
                    "CamelFileName": {
                        type: string;
                    };
                    "CamelFileNameOnly": {
                        type: string;
                    };
                    "CamelFileNameProduced": {
                        type: string;
                    };
                    "CamelFileNameConsumed": {
                        type: string;
                    };
                    "CamelFilePath": {
                        type: string;
                    };
                    "CamelFileParent": {
                        type: string;
                    };
                    "CamelFileLastModified": {
                        type: string;
                    };
                    "CamelFileLength": {
                        type: string;
                    };
                    "CamelFilterMatched": {
                        type: string;
                    };
                    "CamelFileLockFileAcquired": {
                        type: string;
                    };
                    "CamelFileLockFileName": {
                        type: string;
                    };
                    "CamelGroupedExchange": {
                        type: string;
                    };
                    "CamelHttpBaseUri": {
                        type: string;
                    };
                    "CamelHttpCharacterEncoding": {
                        type: string;
                    };
                    "CamelHttpMethod": {
                        type: string;
                    };
                    "CamelHttpPath": {
                        type: string;
                    };
                    "CamelHttpProtocolVersion": {
                        type: string;
                    };
                    "CamelHttpQuery": {
                        type: string;
                    };
                    "CamelHttpResponseCode": {
                        type: string;
                    };
                    "CamelHttpUri": {
                        type: string;
                    };
                    "CamelHttpUrl": {
                        type: string;
                    };
                    "CamelHttpChunked": {
                        type: string;
                    };
                    "CamelHttpServletRequest": {
                        type: string;
                    };
                    "CamelHttpServletResponse": {
                        type: string;
                    };
                    "CamelInterceptedEndpoint": {
                        type: string;
                    };
                    "CamelInterceptSendToEndpointWhenMatched": {
                        type: string;
                    };
                    "CamelLanguageScript": {
                        type: string;
                    };
                    "CamelLogDebugBodyMaxChars": {
                        type: string;
                    };
                    "CamelLogDebugStreams": {
                        type: string;
                    };
                    "CamelLoopIndex": {
                        type: string;
                    };
                    "CamelLoopSize": {
                        type: string;
                    };
                    "CamelMaximumCachePoolSize": {
                        type: string;
                    };
                    "CamelMaximumEndpointCacheSize": {
                        type: string;
                    };
                    "CamelMessageHistory": {
                        type: string;
                    };
                    "CamelMulticastIndex": {
                        type: string;
                    };
                    "CamelMulticastComplete": {
                        type: string;
                    };
                    "CamelNotifyEvent": {
                        type: string;
                    };
                    "CamelOnCompletion": {
                        type: string;
                    };
                    "CamelOverruleFileName": {
                        type: string;
                    };
                    "CamelParentUnitOfWork": {
                        type: string;
                    };
                    "CamelRecipientListEndpoint": {
                        type: string;
                    };
                    "CamelReceivedTimestamp": {
                        type: string;
                    };
                    "CamelRedelivered": {
                        type: string;
                    };
                    "CamelRedeliveryCounter": {
                        type: string;
                    };
                    "CamelRedeliveryMaxCounter": {
                        type: string;
                    };
                    "CamelRedeliveryExhausted": {
                        type: string;
                    };
                    "CamelRedeliveryDelay": {
                        type: string;
                    };
                    "CamelRollbackOnly": {
                        type: string;
                    };
                    "CamelRollbackOnlyLast": {
                        type: string;
                    };
                    "CamelRouteStop": {
                        type: string;
                    };
                    "CamelSoapAction": {
                        type: string;
                    };
                    "CamelSkipGzipEncoding": {
                        type: string;
                    };
                    "CamelSlipEndpoint": {
                        type: string;
                    };
                    "CamelSplitIndex": {
                        type: string;
                    };
                    "CamelSplitComplete": {
                        type: string;
                    };
                    "CamelSplitSize": {
                        type: string;
                    };
                    "CamelTimerCounter": {
                        type: string;
                    };
                    "CamelTimerFiredTime": {
                        type: string;
                    };
                    "CamelTimerName": {
                        type: string;
                    };
                    "CamelTimerPeriod": {
                        type: string;
                    };
                    "CamelTimerTime": {
                        type: string;
                    };
                    "CamelToEndpoint": {
                        type: string;
                    };
                    "CamelTraceEvent": {
                        type: string;
                    };
                    "CamelTraceEventNodeId": {
                        type: string;
                    };
                    "CamelTraceEventTimestamp": {
                        type: string;
                    };
                    "CamelTraceEventExchange": {
                        type: string;
                    };
                    "Transfer-Encoding": {
                        type: string;
                    };
                    "CamelUnitOfWorkExhausted": {
                        type: string;
                    };
                    "CamelUnitOfWorkProcessSync": {
                        type: string;
                    };
                    "CamelXsltFileName": {
                        type: string;
                    };
                };
            };
        };
    };
}
