/* eslint-disable react/react-in-jsx-scope */

import PropTypes from "prop-types";
import {ReactServerAgent, RootElement} from "react-server";

const Even = ({body}) => <div className="even">Hey look I&apos;m even because I am {body}</div>;
Even.propTypes = {
	body: PropTypes.any,
};

export default class ForwardEvenPage {
	handleRoute() {
		const request = this.getRequest();
		let params = request.getQuery();
		if (params) params = params.value;
		else params = 0;

		//fetch some data (should be from cache)
		this.data = ReactServerAgent.get('/data/delay?ms=1000&val='+params);

		return {code: 200};
	}

	getElements() {
		return [
			<RootElement key={0} when={this.data}><Even /></RootElement>,
		];
	}
}
