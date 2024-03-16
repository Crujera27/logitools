/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright © 2024 Crujera27 y contribuidores. Todos los derechos reservados.
    
    GitHub: https://github.com/Crujera27/
    Web: https://crujera.galnod.com
    Licencia del proyecto: CC BY-NC-ND 4.0

*/

module.exports = {
    handler: {
        prefix: "lt!",
        deploy: true,
        commands: {
            prefix: true,
            slash: true,
            user: true,
            message: true,
        },
    },
    users: {
        developers: ["905124554303762552"],
    },
    development: { 
        enabled: true,
        guild: "905124554303762552",
    }, 
    messageSettings: {
        developerMessage: "No estás autorizado/a a utilizar este comando.",
        cooldownMessage: "¡Más despacio amigo/a! Eres demasiado rápido/a para usar este comando. ({cooldown}s).",
        globalCooldownMessage: "¡Más despacio amigo/a! Eres demasiado rápido/a para usar este comando. ({cooldown}s).",
        notHasPermissionMessage: "No tienes permiso para utilizar este comando.",
        notHasPermissionComponent: "No tienes permiso para utilizar este componente.",
        missingDevIDsMessage: "No estás autorizado/a a utilizar este comando."
    }
};