# SDK Java

Repositório: [twila-parcelemais-java-sdk](https://github.com/Twila-Digital/twila-parcelemais-java-sdk)

```xml
<dependency>
    <groupId>br.com.twila</groupId>
    <artifactId>parcelemais</artifactId>
    <version>1.0.0</version>
</dependency>
```

- Compatível com JDK 8 ou superior.
- HTTP via OkHttp (o `HttpClient` nativo do JDK exigiria Java 11+, incompatível com o piso de Java 8).
- Builder fluente: `ParceleMaisClient.builder().clientId(...).clientSecret(...).environment(...).build()`.
- Pacote raiz: `twila.parcelemais` (`twila.parcelemais.config`, etc.).

Ver [rules/java/](../../rules/java) para regras de integração por recurso.
