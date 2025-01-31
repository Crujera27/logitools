/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright (C) 2024 Ángel Crujera (angel.c@galnod.com)

    This program is free software: you can redistribute it and/or modify  
    it under the terms of the GNU Affero General Public License as published by  
    the Free Software Foundation, either version 3 of the License, or  
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,  
    but WITHOUT ANY WARRANTY; without even the implied warranty of  
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the  
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License  
    along with this program. If not, see <https://www.gnu.org/licenses/>.
    
    GitHub: https://github.com/Crujera27/
    Website: https://crujera.galnod.com

*/
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated()) {
        if(req.user.isAdmin=="1"){
          if(req.user.adminVerifyStatus=="adminVerifyStatus" || req.user.adminVerifyStatus=="progress" && req.url!=="/admin/verify" || req.url=="/admin/verify?verificationCode=*"){
            return res.redirect('/admin/verify')
          }else if(req.user.adminVerifyStatus=="locked"){
            return res.status(403).render('error', { error : 'HTTP 403 - Esta cuenta ha sido bloqueada por motivos de seguridad.'});
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