/**
 * Copyright (C) 2019 European Spallation Source ERIC.
 * <p>
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * <p>
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * <p>
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 */
import React, {Component} from 'react';
import './css/olog.css';

/**
 * Component to show list of available logbooks and maintain selection of logbooks
 * to include in a search query.
 */

class Logbooks extends Component{

    logbookSelectionChanged = (event) => {
        this.props.addLogbookToSearchCriteria(event.target.value, event.target.checked);
    }

    render(){
        var items = this.props.logbooks.sort((a, b) => a.name.localeCompare(b.name)).map((row, index) => {
            var check = false;
            if("logbooks" in this.props.searchParams)
                check = this.props.searchParams["logbooks"] === row.name;
            return (
                <div className="radio">
                    <label>
                        <input
                            type="radio"
                            value={row.name}
                            checked={check}
                            onChange={this.logbookSelectionChanged}
                        />
                        {row.name}
                    </label>
                </div>
            )
        })       
        return (
             <ul className="olog-ul">{items}</ul>
        )
    }
}

export default Logbooks
