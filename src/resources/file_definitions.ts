
export const readmeTemplate = (changeRequest: string|undefined) =>
    `${changeRequest}
====================

<descrizione della esposizione o della modifica richiesta>

# Documenti Sharepoint
- [Analisi][1]
- [Richiesta Di Esposizione][2]
- [Stima][3]

# Stakeholders

| nome                      | ruolo              | azienda  |
| ------------------------- | ------------------ | -------- |
|                           |                    |          |

[1]: <inserire Link Analisi qui>
[2]: <inserire Link RdE qui>
[3]: <inserire Link Stima qui>
`;


export const placeHolderTemplate = () =>
    `Il file che stai cercando si trova su [sharepoint][def]!
========================================================


cancellare questo file una volta archiviato il file qua

[def]: https://imolinfo.sharepoint.com/:f:/r/sites/BancoBPM/Documenti%20condivisi/Documenti%20temporanei/In%20Corso
`;

export const swaggerPomTemplate = (file: string, version: string) =>
    `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>it.imolinfo</groupId>
    <artifactId>${file}_v${version}</artifactId>
    <version>${version}.0</version>

    <profiles>
        <profile>
            <id>standard</id>
            <activation>
                <activeByDefault>true</activeByDefault>
            </activation>

            <build>
                <plugins>
                    <plugin>
                        <groupId>it.imolainformatica.plugins</groupId>
                        <artifactId>rest-openapi-validator-maven-plugin</artifactId>
                        <version>1.2.2</version>
                        <configuration>
                            <inputContractBasePath>\${basedir}</inputContractBasePath>
                        </configuration>
                        <executions>
                            <execution>
                                <id>validate</id>
                                <phase>validate</phase>
                                <configuration />
                                <goals>
                                    <goal>validate</goal>
                                </goals>
                            </execution>
                        </executions>
                    </plugin>
                </plugins>
            </build>
        </profile>
    </profiles>
</project>
`;

export const wsdlPomTemplate = (file: string, version: string) => 
`<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">

	<modelVersion>4.0.0</modelVersion>
	<groupId>it.bancobpm</groupId>
	<artifactId>${file}_v${version}</artifactId>
	<packaging>jar</packaging>
	<version>${version}.0</version>
	<name>${file}_v${version}</name>

	<build>
		<plugins>
			<plugin>
				<groupId>it.bancobpm.plugins</groupId>
				<artifactId>validatore-interfaccia-servizi-maven-plugin</artifactId>
				<version>1.3.2</version>
				<configuration>
					<base.dir.wsdl.validation>\${basedir}</base.dir.wsdl.validation>
					<base.dir.xsd.validation>\${basedir}</base.dir.xsd.validation>
					<base.dir.reports>\${project.build.directory}/schematronReport</base.dir.reports>
				</configuration>
				<executions>
					<execution>
						<id>validazione-wsdl</id>
						<phase>validate</phase>
						<goals>
							<goal>all</goal>
						</goals>
					</execution>
				</executions>
			</plugin>
		</plugins>
	</build>
</project>`;