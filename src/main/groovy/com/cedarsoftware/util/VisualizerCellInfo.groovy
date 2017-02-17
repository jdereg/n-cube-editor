package com.cedarsoftware.util

import com.cedarsoftware.ncube.ApplicationID
import com.cedarsoftware.ncube.exception.CoordinateNotFoundException
import com.cedarsoftware.ncube.exception.InvalidCoordinateException
import com.cedarsoftware.ncube.formatters.HtmlFormatter
import com.google.common.base.Joiner
import groovy.transform.CompileStatic

import static com.cedarsoftware.util.VisualizerConstants.*

/**
 * Provides information to visualize an n-cube cell.
 */

@CompileStatic
class VisualizerCellInfo
{
	protected ApplicationID appId
	protected String nodeId

	protected Map<String, Object> coordinate
	protected Object noExecuteCell
	protected Object cell
	protected Exception exception

	protected Joiner.MapJoiner mapJoiner = Joiner.on(", ").withKeyValueSeparator(": ")
	protected VisualizerHelper helper = new VisualizerHelper()

	protected VisualizerCellInfo(){}

	protected VisualizerCellInfo(String nodeId, Map<String, Object> coordinate)
	{
		this.coordinate = coordinate
		this.nodeId = nodeId
	}

	protected void getCellValue(VisualizerScopeInfo scopeInfo, long nodeCount, VisualizerRelInfo visRelInfo, Long id, StringBuilder sb)
	{
		String coordinateString = coordinateString

		if (exception)
		{
			//An exception was caught during the execution of the cell.
			sb.append(getExceptionDetails( scopeInfo, nodeCount, visRelInfo, id, coordinateString))
		}
		else
		{
			//The cell has a value or a null value
			sb.append(getCellDetails(id))
		}
	}

	private String getCoordinateString()
	{
		coordinate.each {String scopeKey, Object value ->
			if (!value)
			{
				coordinate[scopeKey] = 'null'
			}
		}
		return mapJoiner.join(coordinate)
	}

	private String getCellDetails(Long id)
	{
		String noExecuteValue = HtmlFormatter.getCellValueAsString(noExecuteCell)
		String cellString = HtmlFormatter.getCellValueAsString(cell)
		StringBuilder sb = new StringBuilder()
		String coordinateClassName = "coord_${id}"
		String listItemClassName = DETAILS_CLASS_EXECUTED_CELL
		String linkClassNames = "${listItemClassName} ${coordinateClassName}"
		String preClassNames = "${coordinateClassName} ${DETAILS_CLASS_WORD_WRAP}"
		sb.append("""<li class="${listItemClassName}" title="Executed cell"><a href="#" class="${linkClassNames}" id="${nodeId}">${coordinateString}</a></li>""")
		sb.append("""<pre class="${preClassNames}">""")
		sb.append("<b>Non-executed value:</b>")
		sb.append(DOUBLE_BREAK)
		sb.append("${noExecuteValue}")
		sb.append(DOUBLE_BREAK)
		sb.append("<b>Executed value:</b>")
		sb.append(DOUBLE_BREAK)
		if (cell && cellString.startsWith(HTTP) || cellString.startsWith(HTTPS) || cellString.startsWith(FILE))
		{
			sb.append("""<a href="#" onclick='window.open("${cellString}");return false;'>${cellString}</a></a></li>""")
		}
		else
		{
			sb.append("${cellString}")
		}
		sb.append("</pre>")
		return sb.toString()
	}

	private String getExceptionDetails(VisualizerScopeInfo scopeInfo, long nodeCount, VisualizerRelInfo relInfo, Long id, String coordinateString)
	{
		StringBuilder sb = new StringBuilder()
		StringBuilder mb = new StringBuilder()
		String noExecuteValue = HtmlFormatter.getCellValueAsString(noExecuteCell)
		Throwable t = helper.getDeepestException(exception)
		String listItemClassName
		String title

		if (t instanceof InvalidCoordinateException)
		{
			title = 'The cell was executed with a missing or invalid coordinate'
			listItemClassName = t.class.simpleName
			mb.append("Additional scope is required:${DOUBLE_BREAK}")
			mb.append(helper.handleInvalidCoordinateException(t as InvalidCoordinateException, scopeInfo, nodeCount, relInfo, new LinkedHashSet()).toString())
		}
		else if (t instanceof CoordinateNotFoundException)
		{
			title = 'The cell was executed with a missing or invalid coordinate'
			listItemClassName = t.class.simpleName
			CoordinateNotFoundException exc = t as CoordinateNotFoundException
			String scopeKey = exc.axisName
			Object value = exc.value ?: 'null'
			mb.append("The value ${value} is not valid for ${scopeKey}. A different value must be provided:${DOUBLE_BREAK}")
			mb.append(helper.handleCoordinateNotFoundException(t as CoordinateNotFoundException, scopeInfo, nodeCount))
		}
		else
		{
			title = 'An error occurred during the execution of the cell'
			listItemClassName = DETAILS_CLASS_EXCEPTION
			mb.append("An exception was thrown while loading the coordinate.${DOUBLE_BREAK}")
			mb.append(helper.handleException(t))
		}

		String coordinateClassName = "coord_${id}"
		String linkClassNames = "${listItemClassName}, ${coordinateClassName}"
		String preClassNames = "${coordinateClassName} ${DETAILS_CLASS_WORD_WRAP}"
		sb.append("""<li class="${listItemClassName}" title="${title}"><a href="#" class="${linkClassNames}" id="${nodeId}">${coordinateString}</a></li>""")
		sb.append("""<pre class="${preClassNames}">""")
		sb.append("<b>Non-executed value:</b>")
		sb.append(DOUBLE_BREAK)
		sb.append("${noExecuteValue}")
		sb.append(DOUBLE_BREAK)
		sb.append("<b>Exception:</b>")
		sb.append(DOUBLE_BREAK)
		sb.append("${mb.toString()}>")
		sb.append("</pre>")
		return sb.toString()
	}
}