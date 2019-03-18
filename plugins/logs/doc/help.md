## Logs

When we run middleware we spend an awful lot of time looking at and searching logs. With Hawtio we show nicely coloured logs that auto scroll, can be filtered and sorted ascending or descending. Go to the Preferences page to customize the behavior the way you want.

### How to enable Hawtio logs

Hawtio uses an MBean usually called LogQuery which implements the [LogQuerySupportMBean](https://github.com/hawtio/hawtio/blob/master/hawtio-log/src/main/java/io/hawt/log/support/LogQuerySupportMBean.java) interface from either the [hawtio-log-osgi](https://github.com/hawtio/hawtio/tree/master/hawtio-log-osgi) or [hawtio-log](https://github.com/hawtio/hawtio/tree/master/hawtio-log) bundles depending on if you are working inside or outside of OSGi respectively.

If you are using Apache Karaf, just add the hawtio-log-osgi bundle. If you are not using OSGi, then you just need to ensure you have hawtio-log in your WAR when you deploy Hawtio.

You also need to ensure that the LogQuery bean is instantiated in whatever dependency injection framework you choose.

For example, this is how we initialise LogQuery using OSGi blueprint:

```html
<bean id="logFacade" class="io.hawt.log.log4j.Log4jLogQuery" init-method="start" destroy-method="stop" scope="singleton">
  <property name="size" value="${hawtio.log.buffer.size}"/>
</bean>
```

And this is how we initialise LogQuery using Spring XML:

```html
<bean id="logQuery" class="io.fabric8.insight.log.log4j.Log4jLogQuery" lazy-init="false" scope="singleton" init-method="start" destroy-method="stop"/>
```
