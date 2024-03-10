/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright © 2024 Crujera27 y contribuidores. Todos los derechos reservados.
    
    GitHub: https://github.com/Crujera27
    Web: https://crujera.galnod.com
    Licencia del proyecto: MIT

*/

document.addEventListener("DOMContentLoaded", function() {
    const deleteButtons = document.querySelectorAll(".delete-btn");
    
    deleteButtons.forEach(button => {
        button.addEventListener("click", function() {
            const resourceId = this.getAttribute("data-resource-id");
            const confirmDelete = confirm("Are you sure you want to delete this resource?");
            
            if (confirmDelete) {
                const formId = `deleteForm_${resourceId}`;
                document.getElementById(formId).submit();
            }
        });
    });
});