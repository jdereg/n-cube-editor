package com.cedarsoftware.controller

import com.cedarsoftware.ncube.NCubeManager
import groovy.transform.CompileStatic
import org.aspectj.lang.ProceedingJoinPoint
import org.aspectj.lang.annotation.Around
import org.aspectj.lang.annotation.Aspect
import org.springframework.beans.factory.annotation.Autowired

/**
 * Before Advice that sets user ID on current thread.
 *
 * @author John DeRegnaucourt (jdereg@gmail.com)
 *         <br/>
 *         Copyright (c) Cedar Software LLC
 *         <br/><br/>
 *         Licensed under the Apache License, Version 2.0 (the "License")
 *         you may not use this file except in compliance with the License.
 *         You may obtain a copy of the License at
 *         <br/><br/>
 *         http://www.apache.org/licenses/LICENSE-2.0
 *         <br/><br/>
 *         Unless required by applicable law or agreed to in writing, software
 *         distributed under the License is distributed on an "AS IS" BASIS,
 *         WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *         See the License for the specific language governing permissions and
 *         limitations under the License.
 */
@CompileStatic
@Aspect
class NCubeControllerAdvice
{
    @Autowired
    NCubeController controller

    NCubeControllerAdvice() { }

    @Around("execution(* com.cedarsoftware.controller.NCubeController.*(..))")
    def advise(ProceedingJoinPoint pjp)
    {
        try
        {
            // Place user on ThreadLocal
            controller.userForDatabase

            // Execute method
            def ret = pjp.proceed()
            return ret
        }
        catch (Exception e)
        {
            // If there were any exceptions, signal controller (which signals command servlet)
            controller.fail(e)
            return null
        }
    }
}
