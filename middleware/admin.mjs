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
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated()) {
        if(req.user.isAdmin=="1"){
          if(req.user.adminVerifyStatus=="adminVerifyStatus" || req.user.adminVerifyStatus=="progress" && req.url!=="/admin/verify" || req.url=="/admin/verify?verificationCode=*"){
            return res.redirect('/admin/verify')
          }else if(req.user.adminVerifyStatus=="locked"){
            return res.json({code: '403', error: 'Esta cuenta ha sido bloqueada por motivos de seguridad.'})
          }else{
          return next()
          }
        }else{
          return res.redirect("/dashboard")
        }
    } else {
      req.session.returnTo = req.originalUrl;
      res.redirect('/login');
    }
  };
export default isAdmin;